import { expect, test } from "bun:test";
import { realpath } from "node:fs/promises";
import { z } from "zod";
import { cpuTestPython } from "./local-ai-test-runtime.ts";

const pythonKey = "LOCAL_AI_TEST_PYTHON";

test("preserves the prepared virtual environment executable", async () => {
	// Given the operator's actual prepared runtime, including POSIX venv symlinks.
	const command = z.string().min(1).parse(process.env[pythonKey]);
	const key = "LOCAL_AI_RUNTIME_VENV_REGRESSION";
	process.env[key] = command;
	try {
		// When the runtime is probed and propagated to its next caller.
		const python = await cpuTestPython(key);
		// Then its executable retains the venv identity, not the base symlink target.
		expect(python).toBe(command);
		const probe = Bun.spawn(
			[
				python,
				"-I",
				"-c",
				"import sys,numpy,pydantic,PIL; assert sys.prefix != sys.base_prefix; assert 'torch' not in sys.modules",
			],
			{ stdout: "pipe", stderr: "pipe", signal: AbortSignal.timeout(15000) },
		);
		const [stderr, code] = await Promise.all([
			new Response(probe.stderr).text(),
			probe.exited,
		]);
		expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
	} finally {
		delete process.env[key];
	}
});

test("rejects the actual base interpreter of a symlink-backed venv", async () => {
	// Given the real POSIX base executable, not a mocked probe response.
	const command = z.string().min(1).parse(process.env[pythonKey]);
	const identity = Bun.spawn(
		[
			command,
			"-I",
			"-c",
			"import json,sys; print(json.dumps(sys._base_executable))",
		],
		{ stdout: "pipe", stderr: "pipe", signal: AbortSignal.timeout(15000) },
	);
	const [stdout, code] = await Promise.all([
		new Response(identity.stdout).text(),
		identity.exited,
	]);
	expect(code).toBe(0);
	const base = await realpath(z.string().min(1).parse(JSON.parse(stdout)));
	const key = "LOCAL_AI_RUNTIME_BASE_REGRESSION";
	const probe = Bun.spawn(
		[base, "-I", "-c", "import sys; assert sys.prefix == sys.base_prefix"],
		{ stdout: "pipe", stderr: "pipe", signal: AbortSignal.timeout(15000) },
	);
	expect(await probe.exited).toBe(0);
	process.env[key] = base;
	try {
		// When a non-isolated base is offered to the prerequisite probe.
		const result = cpuTestPython(key);
		// Then that interpreter is refused even though the venv itself is ready.
		await expect(result).rejects.toBeInstanceOf(Error);
	} finally {
		delete process.env[key];
	}
});
