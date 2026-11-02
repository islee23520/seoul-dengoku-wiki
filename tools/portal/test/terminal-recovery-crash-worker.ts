import { recoveryFixture } from "./terminal-recovery-fixture.ts";

const point = process.env["TERMINAL_RECOVERY_CRASH_POINT"];
if (point !== "before-commit" && point !== "after-commit")
	throw Error("CRASH_POINT_REQUIRED");
const f = await recoveryFixture({
	checkpoint: async (current) => {
		if (current === point) process.exit(86);
	},
});
console.log(
	JSON.stringify({
		directory: f.directory,
		id: f.id,
		origin: f.origin,
		headers: f.headers(),
		operation: await f.operation(),
	}),
);
