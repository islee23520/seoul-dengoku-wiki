import { spawn } from "node:child_process";
import { type EventEmitter, once } from "node:events";
import { createInterface } from "node:readline";
import type { Readable } from "node:stream";
import type { Config } from "./config.ts";

interface RegistrationProcess extends EventEmitter {
	stdout: Readable;
	stderr: Readable;
	exitCode: number | null;
	signalCode: NodeJS.Signals | null;
	kill(signal: NodeJS.Signals): boolean;
}

export async function startMdns(
	config: Config,
	port: number,
	interfaceName: string,
	onFailure: (error: Error) => void,
	runtime: {
		platform?: NodeJS.Platform;
		spawnProcess?: (
			command: string,
			args: readonly string[],
		) => RegistrationProcess;
	} = {},
) {
	if ((runtime.platform ?? process.platform) !== "darwin")
		throw Error("MDNS_PLATFORM_UNSUPPORTED");
	const hostname = config.localHostname;
	if (!config.mdns || !hostname || !interfaceName)
		throw Error("INVALID_MDNS_CONFIG");
	const name = hostname.slice(0, -6);
	// Proxy registration publishes precisely this A record, not the host's other IPs.
	const child: RegistrationProcess = (
		runtime.spawnProcess ??
		((command, args) =>
			spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] }))
	)("/usr/bin/dns-sd", [
		"-i",
		interfaceName,
		"-P",
		name,
		"_http._tcp",
		"local",
		String(port),
		hostname,
		config.host,
		`path=${config.basePath}/`,
	]);
	let stopping = false;
	let active = false;
	let failed = false;
	let addressReady = false;
	let serviceReady = false;
	let resolveReady: () => void;
	let rejectReady: (error: Error) => void;
	const ready = new Promise<void>((resolve, reject) => {
		resolveReady = resolve;
		rejectReady = reject;
	});
	const fail = () => {
		if (stopping || failed) return;
		failed = true;
		const error = Error("MDNS_REGISTRATION_FAILED");
		if (active) onFailure(error);
		else rejectReady(error);
	};
	const lines = createInterface({ input: child.stdout });
	lines.on("line", (line) => {
		if (/Name in use|Error |registration removed/.test(line)) {
			fail();
			return;
		}
		if (
			line.includes("Got a reply for service ") &&
			!line.includes(`Got a reply for service ${name}._http._tcp.local.:`)
		) {
			fail();
			return;
		}
		if (
			line.includes(
				`Got a reply for record ${hostname}: Name now registered and active`,
			)
		)
			addressReady = true;
		if (
			line.includes(
				`Got a reply for service ${name}._http._tcp.local.: Name now registered and active`,
			)
		)
			serviceReady = true;
		if (addressReady && serviceReady && !active && !failed) {
			active = true;
			resolveReady();
		}
	});
	child.stderr.on("data", fail);
	child.on("error", fail);
	child.on("exit", fail);
	const stop = async () => {
		if (stopping) return;
		stopping = true;
		lines.close();
		if (child.exitCode !== null || child.signalCode !== null) return;
		const closed = once(child, "close", { signal: AbortSignal.timeout(5000) });
		child.kill("SIGTERM");
		await closed;
	};
	const timeout = setTimeout(fail, 10000);
	try {
		await ready;
		return stop;
	} catch (error) {
		await stop();
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}
