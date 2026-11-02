import { isAbsolute } from "node:path";
import { z } from "zod";

const identitySchema = z.object({ python: z.string().min(1) });
const runtimes = new Map<string, Promise<string>>();
const commonPythonKey = "LOCAL_AI_TEST_PYTHON";

class CpuTestRuntimeError extends Error {}

export function cpuTestPython(key: string): Promise<string> {
	const cached = runtimes.get(key);
	if (cached) return cached;
	const runtime = (async () => {
		const command = process.env[key] ?? process.env[commonPythonKey];
		if (!command)
			throw new CpuTestRuntimeError(
				`${key} is required: set LOCAL_AI_TEST_PYTHON to a prepared isolated CPU Python executable; see tools/local-ai/README.md (CPU tests).`,
			);
		if (!isAbsolute(command))
			throw new CpuTestRuntimeError(
				`${key} must be an absolute executable path`,
			);
		// Python locates pyvenv.cfg from the invocation path, not its symlink target.
		const python = command;
		const probe = Bun.spawn(
			[
				python,
				"-I",
				"-c",
				"import json,sys,numpy,pydantic,PIL; assert sys.prefix != sys.base_prefix, 'isolated virtual environment required'; assert sys.version_info >= (3,10), 'Python >=3.10 required'; assert int(pydantic.__version__.split('.')[0]) == 2, 'Pydantic v2 required'; print(json.dumps({'python':sys.executable}))",
			],
			{ stdout: "pipe", stderr: "pipe", signal: AbortSignal.timeout(15000) },
		);
		const [stdout, stderr, code] = await Promise.all([
			new Response(probe.stdout).text(),
			new Response(probe.stderr).text(),
			probe.exited,
		]);
		if (code !== 0)
			throw new CpuTestRuntimeError(
				`${key} CPU prerequisite probe failed (${code}): ${stderr}. Prepare numpy, pydantic v2 and Pillow in the isolated runtime before testing; see tools/local-ai/README.md.`,
			);
		return identitySchema.parse(JSON.parse(stdout)).python;
	})();
	runtimes.set(key, runtime);
	return runtime;
}
