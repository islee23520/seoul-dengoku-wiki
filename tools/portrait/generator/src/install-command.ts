import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { installPortraitBinary } from "./install-binary.js";

class InstallCliError extends Error {
	constructor(readonly code: "INVALID_ARGUMENTS" | "INSTALL_FAILED") {
		super(code);
	}
}

export async function main(args: readonly string[]): Promise<void> {
	try {
		const options = new Map<string, string>();
		let allowLocalHttp = false;
		for (let index = 0; index < args.length; index++) {
			const key = args[index];
			if (key === "--allow-local-http") {
				if (allowLocalHttp) throw new InstallCliError("INVALID_ARGUMENTS");
				allowLocalHttp = true;
				continue;
			}
			if (
				key === undefined ||
				!["--url", "--sha256", "--destination"].includes(key) ||
				options.has(key)
			)
				throw new InstallCliError("INVALID_ARGUMENTS");
			const value = args[++index];
			if (!value || value.startsWith("--"))
				throw new InstallCliError("INVALID_ARGUMENTS");
			options.set(key, value);
		}
		const url = options.get("--url");
		const expectedSHA256 = options.get("--sha256");
		const destination = options.get("--destination");
		if (!url || !expectedSHA256 || !destination)
			throw new InstallCliError("INVALID_ARGUMENTS");
		const result = await installPortraitBinary({
			url,
			expectedSHA256,
			destination,
			allowLocalHttp,
		});
		if (!result.installed) throw new InstallCliError("INSTALL_FAILED");
		process.stdout.write(
			`${JSON.stringify({ installed: true, path: destination, sha256: expectedSHA256 })}\n`,
		);
	} catch (error: unknown) {
		if (!(error instanceof InstallCliError)) throw error;
		process.stderr.write(`${error.code}: ${error.code}\n`);
		process.exitCode = 1;
	}
}

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
