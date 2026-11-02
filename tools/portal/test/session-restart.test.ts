import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";

const config = loadConfig({
	PORTAL_MODE: "hosted",
	PORTAL_SESSION_SECRET: "restart-fixture-secret-".repeat(3),
});

async function restarted(token: string) {
	const source = fileURLToPath(new URL("../src/auth.ts", import.meta.url));
	const cfg = fileURLToPath(new URL("../src/config.ts", import.meta.url));
	const code = `
		import { createAuth } from ${JSON.stringify(source)};
		import { loadConfig } from ${JSON.stringify(cfg)};
		const auth = createAuth(loadConfig({ PORTAL_MODE: "hosted", PORTAL_SESSION_SECRET: process.env.FIXTURE_SECRET }));
		console.log(JSON.stringify({
			accepted: auth.verify(process.env.FIXTURE_TOKEN) !== null,
			freshAccepted: auth.verify(auth.issue({ id: "42", login: "fixture" })) !== null,
		}));
	`;
	const child = spawn("node", ["--input-type=module", "-e", code], {
		env: {
			...process.env,
			FIXTURE_SECRET: config.secret,
			FIXTURE_TOKEN: token,
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (chunk) => {
		stdout += String(chunk);
	});
	child.stderr.on("data", (chunk) => {
		stderr += String(chunk);
	});
	const exit = await new Promise<number | null>((resolve, reject) => {
		child.once("error", reject);
		child.once("exit", resolve);
	});
	if (exit !== 0) throw Error(stderr);
	return JSON.parse(stdout) as {
		accepted: boolean;
		freshAccepted: boolean;
	};
}

test("logout replay cannot regain validity after actual Node process restart", async () => {
	const first = createAuth(config);
	const token = first.issue({ id: "42", login: "fixture" });
	expect(first.verify(token)?.id).toBe("42");
	first.logout(token);
	expect(first.verify(token)).toBeNull();
	const result = await restarted(token);
	expect(result.accepted).toBe(false);
	expect(result.freshAccepted).toBe(true);
});

test("restart policy invalidates nonrevoked sessions while same boot stays valid", async () => {
	const first = createAuth(config);
	const token = first.issue({ id: "42", login: "fixture" });
	expect(first.verify(token)?.id).toBe("42");
	expect((await restarted(token)).accepted).toBe(false);
});
