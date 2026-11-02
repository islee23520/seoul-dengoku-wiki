import { createHash } from "node:crypto";
import { link, lstat, mkdtemp, open, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface InstallPortraitBinaryOptions {
	url: string;
	expectedSHA256: string;
	destination: string;
	allowLocalHttp?: boolean;
}

export interface InstallPortraitBinaryResult {
	installed: boolean;
}

export async function installPortraitBinary(
	options: InstallPortraitBinaryOptions,
): Promise<InstallPortraitBinaryResult> {
	if (!/^[a-f0-9]{64}$/.test(options.expectedSHA256))
		return { installed: false };
	let url: URL;
	try {
		url = new URL(options.url);
	} catch (error) {
		if (error instanceof TypeError) return { installed: false };
		throw error;
	}
	const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
	if (
		url.username ||
		url.password ||
		(url.protocol !== "https:" &&
			!(url.protocol === "http:" && local && options.allowLocalHttp === true))
	)
		return { installed: false };
	try {
		await lstat(options.destination);
		return { installed: false };
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
			throw error;
	}
	let bytes: Uint8Array;
	try {
		const response = await fetch(url, {
			redirect: "error",
			signal: AbortSignal.timeout(120_000),
		});
		if (!response.ok) return { installed: false };
		bytes = new Uint8Array(await response.arrayBuffer());
	} catch (error) {
		if (error instanceof TypeError || error instanceof DOMException)
			return { installed: false };
		throw error;
	}
	if (
		createHash("sha256").update(bytes).digest("hex") !== options.expectedSHA256
	)
		return { installed: false };
	const temporary = await mkdtemp(
		join(dirname(options.destination), ".portrait-install-"),
	);
	try {
		const staged = join(temporary, "executable");
		const file = await open(staged, "wx", 0o755);
		try {
			await file.writeFile(bytes);
			await file.sync();
		} finally {
			await file.close();
		}
		try {
			await link(staged, options.destination);
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "EEXIST")
				return { installed: false };
			throw error;
		}
	} finally {
		await rm(temporary, { recursive: true });
	}
	return { installed: true };
}
