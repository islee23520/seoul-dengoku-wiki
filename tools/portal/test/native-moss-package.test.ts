import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
	cp,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { loadConfig } from "../src/config.ts";
import {
	nativeMossPackageFiles,
	nativeMossPackageRoot,
	writeNativeMossPackage,
} from "../src/native-moss-package.ts";
import { createReleasePackage } from "../src/release-package.ts";
import { createPortal } from "../src/server.ts";

const source = fileURLToPath(new URL("../native-moss/", import.meta.url));
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");

test("native private package ships only manifest closure and exact stored TAR/ZIP bytes", async () => {
	const root = await mkdtemp(join(tmpdir(), "native-private-package-"));
	try {
		const input = join(root, "input");
		await cp(source, input, { recursive: true });
		// Explicit candidate snapshot while runtime owner is active. Never rewrite
		// the product manifest or call these fixture bytes independently approved.
		const candidate = JSON.parse(
			await readFile(join(input, "manifest.json"), "utf8"),
		);
		for (const name of Object.keys(candidate.files)) {
			const bytes = await readFile(join(input, name));
			candidate.files[name] = { sha256: hash(bytes), size: bytes.length };
		}
		candidate.implementationSHA256 = createHash("sha256")
			.update(JSON.stringify(candidate.files))
			.digest("hex");
		await writeFile(join(input, "manifest.json"), JSON.stringify(candidate));
		await writeFile(
			join(input, "untracked-secret.env"),
			"never-package-canary",
		);
		const files = await writeNativeMossPackage(input, join(root, "dist"));
		const manifest = JSON.parse(
			await readFile(join(input, "manifest.json"), "utf8"),
		);
		expect(files.map((file) => file.path).sort()).toEqual(
			["manifest.json", ...Object.keys(manifest.files)]
				.map((name) => `private/native-moss/${name}`)
				.sort(),
		);
		for (const file of files) {
			expect(file.path.startsWith("private/native-moss/")).toBe(true);
			expect(
				(await readFile(join(root, "dist", file.path))).equals(file.data),
			).toBe(true);
			expect(hash(file.data)).toBe(file.sha256);
		}
		const release = createReleasePackage(files);
		for (const archive of release.archives) {
			expect(archive.data.includes(Buffer.from("never-package-canary"))).toBe(
				false,
			);
			const shipped = new Map<string, Buffer>();
			let offset = 0;
			if (archive.format === "tar") {
				while (archive.data[offset] !== 0) {
					const name = archive.data
						.subarray(offset, offset + 100)
						.toString()
						.replace(/\0+$/, "");
					const size = Number.parseInt(
						archive.data
							.subarray(offset + 124, offset + 136)
							.toString()
							.replace(/[\0 ]+$/, ""),
						8,
					);
					shipped.set(
						name,
						archive.data.subarray(offset + 512, offset + 512 + size),
					);
					offset += 512 + Math.ceil(size / 512) * 512;
				}
			} else {
				while (archive.data.readUInt32LE(offset) === 0x04034b50) {
					const size = archive.data.readUInt32LE(offset + 18);
					const nameSize = archive.data.readUInt16LE(offset + 26);
					const name = archive.data
						.subarray(offset + 30, offset + 30 + nameSize)
						.toString();
					shipped.set(
						name,
						archive.data.subarray(
							offset + 30 + nameSize,
							offset + 30 + nameSize + size,
						),
					);
					offset += 30 + nameSize + size;
				}
			}
			expect([...shipped.keys()].sort()).toEqual(
				files.map((file) => file.path).sort(),
			);
			for (const file of files)
				expect(shipped.get(file.path)).toEqual(file.data);
		}
		const build = Bun.spawn(
			["bun", fileURLToPath(new URL("../src/build.ts", import.meta.url))],
			{
				env: {
					...process.env,
					PORTAL_BUILD_NATIVE_SOURCE: input,
					PORTAL_BUILD_OUTPUT: join(root, "built"),
				},
				stdout: "pipe",
				stderr: "pipe",
				signal: AbortSignal.timeout(60000),
			},
		);
		const [status, stdout, stderr] = await Promise.all([
			build.exited,
			new Response(build.stdout).text(),
			new Response(build.stderr).text(),
		]);
		expect(stderr).toBe("");
		expect(status).toBe(0);
		expect(stdout).toContain("PORTAL_BUILD_READY");
		const builtManifest = JSON.parse(
			await readFile(join(root, "built", "release-manifest.json"), "utf8"),
		);
		expect(
			builtManifest.privateFiles.filter((path: string) =>
				path.startsWith("private/native-moss/"),
			),
		).toEqual(files.map((file) => file.path));
		expect(
			builtManifest.publicFiles.some((path: string) =>
				path.includes("native-moss"),
			),
		).toBe(false);
		for (const file of files)
			expect(
				(await readFile(join(root, "built", file.path))).equals(file.data),
			).toBe(true);
		const builtTar = await readFile(join(root, "built", "ssstool-release.tar"));
		expect(
			builtTar.includes(Buffer.from("private/native-moss/manifest.json")),
		).toBe(true);
		expect(builtTar.includes(Buffer.from("never-package-canary"))).toBe(false);
		expect(nativeMossPackageRoot("file:///pkg/src/server.ts").href).toBe(
			"file:///pkg/native-moss/",
		);
		expect(nativeMossPackageRoot("file:///pkg/dist/server.mjs").href).toBe(
			"file:///pkg/dist/private/native-moss/",
		);
		await writeFile(join(input, "job.py"), "drift");
		await expect(nativeMossPackageFiles(input)).rejects.toThrow(
			"NATIVE_PACKAGE_FILE_DRIFT",
		);
		await rm(join(input, "job.py"));
		await symlink(join(source, "job.py"), join(input, "job.py"));
		await expect(nativeMossPackageFiles(input)).rejects.toThrow(
			"NATIVE_PACKAGE_FILE_KIND",
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("actual portal static routes never serve native private worker files", async () => {
	const root = await mkdtemp(join(tmpdir(), "native-private-route-"));
	const canonical = createTransportFixture();
	const app = await createPortal(
		loadConfig({
			PORTAL_PORT: "0",
			PORTAL_STORAGE_PATH: join(root, "storage"),
		}),
		{
			template: {
				candidate: canonical.candidate,
				operatorPins: canonical.operatorPins,
			},
		},
	);
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 5000);
		try {
			const listening = once(app.server, "listening", {
				signal: controller.signal,
			});
			app.server.listen(0, "127.0.0.1");
			await listening;
		} finally {
			clearTimeout(timer);
		}
		const address = app.server.address();
		if (!address || typeof address === "string") throw Error("ADDRESS");
		const boot = await fetch(
			`http://127.0.0.1:${address.port}/tools/api/auth/session`,
		);
		expect(boot.status).toBe(200);
		const cookie = (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
		for (const path of [
			"private/native-moss/job.py",
			"private/native-moss/manifest.json",
			"native-moss/runtime.py",
			"public/../private/native-moss/lifecycle.py",
			"models/model.safetensors",
		]) {
			const response = await fetch(
				`http://127.0.0.1:${address.port}/tools/${path}`,
				{ headers: { cookie } },
			);
			expect(response.status).toBe(404);
			expect(await response.text()).not.toContain("terminal_receipt");
		}
	} finally {
		await app.close();
		await rm(root, { recursive: true, force: true });
	}
});
