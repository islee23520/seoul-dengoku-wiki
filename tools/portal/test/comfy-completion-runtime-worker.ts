import { completionFixture } from "./comfy-completion-fixture.ts";

const fixture = await completionFixture();
try {
	const response = await fixture.post();
	const body = await response.json();
	const result = await fixture.get(`/jobs/${fixture.id}/result`);
	const resultStatus = result.status;
	await fixture.restart();
	const replay = await fixture.post();
	console.log(
		JSON.stringify({
			runtime: process.version,
			status: response.status,
			body,
			resultStatus,
			replayStatus: replay.status,
			calls: fixture.state.calls,
		}),
	);
	if (response.status !== 201 || resultStatus !== 200 || replay.status !== 200)
		process.exitCode = 1;
} finally {
	await fixture.close();
}
