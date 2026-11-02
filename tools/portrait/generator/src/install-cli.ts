import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { main } from "./install-command.js";

export { main };

let invokedPath: string | undefined;
if (
	process.versions.bun === undefined &&
	!process.execArgv.some(
		(arg) =>
			["-e", "--eval", "-p", "--print", "--input-type"].includes(arg) ||
			arg.startsWith("--eval=") ||
			arg.startsWith("--print=") ||
			arg.startsWith("--input-type="),
	)
) {
	const commandLine = (
		process.report.getReport() as { header: { commandLine: string[] } }
	).header.commandLine;
	const index = process.execArgv.length + 1;
	invokedPath =
		commandLine[index] === "--" ? commandLine[index + 1] : commandLine[index];
}

if (
	process.versions.bun !== undefined
		? import.meta.main
		: invokedPath !== undefined &&
			invokedPath !== "-" &&
			realpathSync(invokedPath) === fileURLToPath(import.meta.url)
) {
	void main(process.argv.slice(2));
}
