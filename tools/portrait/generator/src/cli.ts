#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runPortraitCommand } from "./command-runner.js";

let invokedPath: string | undefined;
if (
	!("bun" in process.versions && process.execArgv[0] === "-") &&
	!process.execArgv.some(
		(arg) =>
			["-e", "--eval", "-p", "--print", "--input-type"].includes(arg) ||
			arg.startsWith("--eval=") ||
			arg.startsWith("--print=") ||
			arg.startsWith("--input-type="),
	)
) {
	const commandLine =
		"bun" in process.versions
			? process.argv
			: (
					process.report.getReport() as {
						header: { commandLine: string[] };
					}
				).header.commandLine;
	const index = "bun" in process.versions ? 1 : process.execArgv.length + 1;
	invokedPath =
		commandLine[index] === "--" ? commandLine[index + 1] : commandLine[index];
}

if (
	import.meta.main ||
	(invokedPath !== undefined &&
		invokedPath !== "-" &&
		realpathSync(invokedPath) === fileURLToPath(import.meta.url))
) {
	void runPortraitCommand(process.argv.slice(2));
}
