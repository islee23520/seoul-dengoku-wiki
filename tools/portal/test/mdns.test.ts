import { expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { loadConfig } from "../src/config.ts";
import { startMdns } from "../src/mdns.ts";

class NativeFixture extends EventEmitter {
	stdout = new PassThrough();
	stderr = new PassThrough();
	exitCode: number | null = null;
	signalCode: NodeJS.Signals | null = null;
	kills: NodeJS.Signals[] = [];
	kill(signal: NodeJS.Signals = "SIGTERM") {
		this.kills.push(signal);
		this.signalCode = signal;
		this.emit("exit", null, signal);
		this.emit("close", null, signal);
		return true;
	}
}

const config = loadConfig(
	{
		PORTAL_NETWORK_ACCESS: "true",
		PORTAL_HOST: "192.168.0.218",
		PORTAL_LOCAL_HOSTNAME: "portal-fixture.local",
		PORTAL_MDNS: "true",
	},
	{ lan: [{ address: "192.168.0.218", family: "IPv4", internal: false }] },
);

test("native mDNS registers only selected interface IP actual port and cleans up", async () => {
	const child = new NativeFixture();
	let args: readonly string[] = [];
	let fatal: Error | null = null;
	const started = startMdns(
		config,
		23456,
		"en0",
		(error) => {
			fatal = error;
		},
		{
			platform: "darwin",
			spawnProcess: (command, values) => {
				expect(command).toBe("/usr/bin/dns-sd");
				args = values;
				queueMicrotask(() => {
					child.stdout.write(
						"Got a reply for record portal-fixture.local: Name now registered and active\n",
					);
					child.stdout.write(
						"Got a reply for service portal-fixture._http._tcp.local.: Name now registered and active\n",
					);
				});
				return child;
			},
		},
	);
	const stop = await started;
	expect(args).toEqual([
		"-i",
		"en0",
		"-P",
		"portal-fixture",
		"_http._tcp",
		"local",
		"23456",
		"portal-fixture.local",
		"192.168.0.218",
		"path=/tools/",
	]);
	expect(fatal).toBeNull();
	await stop();
	await stop();
	expect(child.kills).toEqual(["SIGTERM"]);
	expect(fatal).toBeNull();
});

test("mDNS address conflict fails readiness and kills registration", async () => {
	const child = new NativeFixture();
	const started = startMdns(config, 23456, "en0", () => {}, {
		platform: "darwin",
		spawnProcess: () => {
			queueMicrotask(() =>
				child.stdout.write(
					"Got a reply for record portal-fixture.local: Name in use, please choose another\n",
				),
			);
			return child;
		},
	});
	await expect(started).rejects.toThrow("MDNS_REGISTRATION_FAILED");
	expect(child.kills).toEqual(["SIGTERM"]);
});

test("mDNS post-readiness native exit reports failure; unsupported platforms are explicit", async () => {
	const child = new NativeFixture();
	let fatal: Error | null = null;
	const stop = await startMdns(
		config,
		23456,
		"en0",
		(error) => {
			fatal = error;
		},
		{
			platform: "darwin",
			spawnProcess: () => {
				queueMicrotask(() => {
					child.stdout.write(
						"Got a reply for record portal-fixture.local: Name now registered and active\n",
					);
					child.stdout.write(
						"Got a reply for service portal-fixture._http._tcp.local.: Name now registered and active\n",
					);
				});
				return child;
			},
		},
	);
	child.exitCode = 1;
	child.emit("exit", 1, null);
	child.emit("close", 1, null);
	expect(fatal).toMatchObject({ message: "MDNS_REGISTRATION_FAILED" });
	await stop();
	await expect(
		startMdns(config, 23456, "en0", () => {}, { platform: "win32" }),
	).rejects.toThrow("MDNS_PLATFORM_UNSUPPORTED");
});
