import { completionFixture } from "./comfy-completion-fixture.ts";

const point = process.env["COMFY_COMPLETION_CRASH_POINT"];
if (point !== "before-commit" && point !== "after-commit")
	throw Error("CRASH_POINT_REQUIRED");
const fixture = await completionFixture({
	checkpoint: async (current) => {
		if (current === point) process.exit(86);
	},
});
console.log(
	JSON.stringify({
		directory: fixture.directory,
		id: fixture.id,
		origin: fixture.origin,
		headers: fixture.headers(),
		request: fixture.request,
	}),
);
