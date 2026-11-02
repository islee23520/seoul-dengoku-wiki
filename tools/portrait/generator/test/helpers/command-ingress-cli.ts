import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runPortraitCommand } from "../../src/command-runner.js";

const entry = process.argv[1];
if (
	import.meta.main ||
	(entry !== undefined &&
		existsSync(entry) &&
		resolve(realpathSync(entry)) ===
			resolve(realpathSync(fileURLToPath(import.meta.url))))
) {
	void runPortraitCommand(process.argv.slice(2));
}
