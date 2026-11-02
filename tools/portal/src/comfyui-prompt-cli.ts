import { readFile } from "node:fs/promises";
import {
	ComfyPromptError,
	compileComfyPortraitPrompt,
} from "./comfyui-prompt.ts";

// Evaluation JSON boundary. No models, providers or generation are loaded.
try {
	const token = JSON.parse(await readFile(process.argv[2] ?? "", "utf8"));
	const result = compileComfyPortraitPrompt(
		token,
		"moss-image-sft-style-lora.v1",
	);
	const requiredValues: Record<string, string> = {};
	for (const field of [
		"outfit.headwear",
		"accessories.description",
		"accessories.shape",
		"accessories.color",
		"accessories.material",
		"accessories.mounting",
	]) {
		const [section, key] = field.split(".");
		const value = token.slots?.[section ?? ""]?.[key ?? ""]?.value;
		if (typeof value === "string" && result.fields.includes(field))
			requiredValues[field] = value
				.replace(/\s+/g, " ")
				.trim()
				.replace(/[\s.;,]+$/u, "");
	}
	console.log(
		JSON.stringify({
			...result,
			requiredValues,
			modelLoaded: false,
			generationDispatched: false,
		}),
	);
} catch (error) {
	if (!(error instanceof ComfyPromptError)) throw error;
	console.log(
		JSON.stringify({
			code: error.code,
			fields: error.fields,
			budget: error.budget,
			modelLoaded: false,
			generationDispatched: false,
		}),
	);
	process.exitCode = 2;
}
