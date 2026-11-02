import { cpuTestPython } from "./local-ai-test-runtime.ts";

for (const key of [
	"LOCAL_AI_TEST_PYTHON",
	"UNIMATE_TEST_PYTHON",
	"UNIFORGE3D_TEST_PYTHON",
]) {
	process.env[key] = await cpuTestPython(key);
}
