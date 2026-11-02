import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.ts";
import { createPortal } from "./server.ts";

const publicPathKey = "PORTAL_PUBLIC_PATH";
const tokensPathKey = "PORTAL_TOKENS_PATH";
const config = loadConfig({
	...process.env,
	PORTAL_PUBLIC_PATH:
		process.env[publicPathKey] ||
		fileURLToPath(new URL("./public/", import.meta.url)),
	PORTAL_TOKENS_PATH:
		process.env[tokensPathKey] ||
		fileURLToPath(new URL("./public/tokens.css", import.meta.url)),
});
const app = await createPortal(config);
app.server.on("mdns-error", () => {
	console.error("MDNS_REGISTRATION_FAILED");
	process.exitCode = 1;
});
const address = await app.listen();
console.log(
	"PORTAL_READY host=" +
		config.host +
		" port=" +
		address.port +
		" configured=" +
		config.ready +
		" networkAccess=" +
		config.networkAccess +
		" mdns=" +
		config.mdns +
		" localHostname=" +
		(config.localHostname ?? "none"),
);
let shutdown: Promise<void> | undefined;
let acknowledgementSubscribed = false;
function acknowledge(type: "drained" | "drain-failed") {
	if (!process.connected) {
		console.error("NATIVE_IPC_ACK_FAILED: disconnected");
		process.exitCode = 1;
		return;
	}
	process.send?.({ schema: "portal-native-ipc.v1", type }, (error) => {
		if (error) {
			console.error("NATIVE_IPC_ACK_FAILED", error);
			process.exitCode = 1;
		}
		if (process.connected) process.disconnect?.();
	});
}
function startShutdown() {
	if (!shutdown) {
		shutdown = Promise.resolve().then(() => app.close());
		void shutdown.then(
			() => {
				if (acknowledgementSubscribed) acknowledge("drained");
				else if (process.connected) process.disconnect?.();
			},
			(error: unknown) => {
				console.error("NATIVE_DRAIN_FAILED", error);
				process.exitCode = 1;
				if (process.connected) acknowledge("drain-failed");
			},
		);
	}
	return shutdown;
}
// Only an inherited Node IPC channel can control this process. No network route
// or ambient environment variable enables the native drain protocol.
if (process.send && process.channel) {
	process.on("message", (message: unknown) => {
		if (
			!message ||
			typeof message !== "object" ||
			Array.isArray(message) ||
			Object.keys(message).length !== 2 ||
			(message as { schema?: unknown }).schema !== "portal-native-ipc.v1" ||
			(message as { type?: unknown }).type !== "stop"
		)
			return;
		if (acknowledgementSubscribed) return;
		acknowledgementSubscribed = true;
		startShutdown();
	});
	process.send({ schema: "portal-native-ipc.v1", type: "ready" });
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
	process.once(signal, () => {
		startShutdown();
	});
