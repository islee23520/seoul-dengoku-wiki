import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	copyFile,
	link,
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// allow: SIZE_OK — six real SQLite rows and a fault matrix share one owned fixture.
const { guard } = createRequire(import.meta.url)(
	"../install/native-sqlite-guard.mjs",
);

const digest = (value: Uint8Array | string) =>
	createHash("sha256").update(value).digest("hex");
const guardPath = new URL(
	"../install/native-sqlite-guard.mjs",
	import.meta.url,
);

async function fixture() {
	const root = await mkdtemp(join(await realpath(tmpdir()), "native-guard-"));
	const inputRoot = join(root, "inputs");
	const output = join(root, "database");
	await mkdir(inputRoot);
	await mkdir(output);
	const sourcePath = join(inputRoot, "originals.sqlite");
	const tempPath = join(output, "originals.sqlite.fixture.tmp");
	const finalPath = join(output, "originals.sqlite");
	const db = new DatabaseSync(sourcePath);
	db.exec(`CREATE TABLE people(person_id TEXT, character_id TEXT, name TEXT);
		CREATE TABLE current_originals(person_id TEXT, detail_sha256 TEXT, token_sha256 TEXT, image_sha256 TEXT);
		CREATE TABLE detail_revisions(person_id TEXT, import_sequence INTEGER, url TEXT, sha256 TEXT, bytes BLOB);
		CREATE TABLE token_revisions(person_id TEXT, import_sequence INTEGER, url TEXT, sha256 TEXT, bytes BLOB);
		CREATE TABLE image_revisions(person_id TEXT, import_sequence INTEGER, url TEXT, sha256 TEXT, bytes BLOB);`);
	const canonicalSix = [];
	for (let i = 1; i <= 6; i++) {
		const person = `person-${i}`;
		const character = `character-${i}`;
		const name = `Fixture ${i}`;
		const blobs = {
			detail: Buffer.from(
				JSON.stringify({
					id: person,
					name,
					familyTree: { personId: character },
					detailRoute: `/people/${person}`,
				}),
			),
			token: Buffer.from(
				JSON.stringify({
					personId: person,
					name,
					characterId: character,
					image: { sha256: digest(`image-${i}`) },
					generationContract: {},
					slots: [],
				}),
			),
			image: Buffer.from(`image-${i}`),
		};
		const hashes = {
			detail: digest(blobs.detail),
			token: digest(blobs.token),
			image: digest(blobs.image),
		};
		canonicalSix.push({
			personId: person,
			characterId: character,
			sourceHashes: hashes,
		});
		db.prepare("INSERT INTO people VALUES (?,?,?)").run(
			person,
			character,
			name,
		);
		db.prepare("INSERT INTO current_originals VALUES (?,?,?,?)").run(
			person,
			hashes.detail,
			hashes.token,
			hashes.image,
		);
		for (const kind of ["detail", "token", "image"] as const) {
			db.prepare(`INSERT INTO ${kind}_revisions VALUES (?,?,?,?,?)`).run(
				person,
				1,
				`fixture:${kind}`,
				hashes[kind],
				blobs[kind],
			);
		}
	}
	db.close();
	const seedBytes = await readFile(sourcePath);
	const plan = {
		seed: { bytes: seedBytes.length, sha256: digest(seedBytes) },
		canonicalSix,
		inputs: [
			{
				path: "originals.sqlite",
				bytes: seedBytes.length,
				sha256: digest(seedBytes),
			},
		],
	};
	const custody = {
		schema: "native-guard-custody.v1",
		writersStopped: true,
		originalHandlesExited: true,
		fenceHeld: true,
		markerDisposition: "absent",
		synthetic: true,
	};
	const action = {
		schema: "native-db-action-binding.v1",
		id: "fixture",
		sourcePath,
		tempPath,
		finalPath,
		inputRoot,
		planSha256: digest(JSON.stringify(plan)),
		guardSha256: digest(await readFile(guardPath)),
		custodySha256: digest(JSON.stringify(custody)),
		captureSha256: null as string | null,
	};
	const args = {
		inputRoot,
		sourcePath,
		tempPath,
		finalPath,
		plan,
		action,
		custody,
		interpreter:
			process.platform === "win32"
				? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
				: "",
	};
	return { root, output, seedBytes, args };
}

test("allows unchanged synthetic seed through capture, pre-copy, post-copy and rollback", async () => {
	// Given: a sealed standalone seed and explicit synthetic stopped-writer custody.
	const f = await fixture();
	try {
		// When: each read-only phase examines the same immutable fixture.
		const capture = await guard({ ...f.args, mode: "capture" });
		f.args.action.captureSha256 = digest(JSON.stringify(capture));
		const pre = await guard({ ...f.args, mode: "pre-copy", expected: capture });
		await copyFile(f.args.sourcePath, f.args.tempPath);
		const post = await guard({
			...f.args,
			mode: "post-copy",
			expected: capture,
		});
		await rm(f.args.tempPath);
		await copyFile(f.args.sourcePath, f.args.finalPath);
		const rollback = await guard({
			...f.args,
			mode: "rollback",
			expected: capture,
		});
		// Then: only the unchanged seed receives the synthetic rollback classification.
		expect([capture.ok, pre.ok, post.ok, rollback.gate]).toEqual([
			true,
			true,
			true,
			"UNCHANGED_SEED_ONLY",
		]);
		expect(await readFile(f.args.sourcePath)).toEqual(f.seedBytes);
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

for (const [label, change] of [
	[
		"missing custody",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			Object.assign(f.args, { custody: undefined });
		},
	],
	[
		"missing fence",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.custody.fenceHeld = false;
		},
	],
	[
		"unreconciled marker",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.custody.markerDisposition = "stale";
		},
	],
	[
		"wrong-PID marker",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.custody.markerDisposition = "wrong-pid";
		},
	],
	[
		"wrong plan hash",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.action.planSha256 = digest("other");
		},
	],
	[
		"wrong guard hash",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.action.guardSha256 = digest("other");
		},
	],
	[
		"wrong source path",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.action.sourcePath = f.args.finalPath;
		},
	],
	[
		"wrong temp path",
		(f: Awaited<ReturnType<typeof fixture>>) => {
			f.args.action.tempPath = f.args.finalPath;
		},
	],
	[
		"unknown sibling",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await writeFile(join(f.output, "unexpected"), "untouched");
		},
	],
	[
		"writer marker",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await writeFile(join(f.output, "portal-writer.lock"), "fixture");
		},
	],
	[
		"mixed-case WAL",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await writeFile(join(f.output, "ORIGINALS.SQLITE-WaL"), "fixture");
		},
	],
	[
		"mixed-case journal",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await writeFile(
				join(f.args.inputRoot, "ORIGINALS.SQLITE-JOURNAL"),
				"fixture",
			);
		},
	],
	[
		"missing main",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await rm(f.args.sourcePath);
		},
	],
	[
		"changed main",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await writeFile(f.args.sourcePath, "changed");
		},
	],
	[
		"hardlink",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			await link(f.args.sourcePath, join(f.root, "alias"));
		},
	],
	[
		"reparse link",
		async (f: Awaited<ReturnType<typeof fixture>>) => {
			const target = join(f.root, "originals-copy.sqlite");
			await copyFile(f.args.sourcePath, target);
			await rm(f.args.sourcePath);
			await symlink(target, f.args.sourcePath);
		},
	],
] as const) {
	test(`rejects ${label} while preserving fixture bytes`, async () => {
		// Given: a controlled fixture and one hostile or uncertain state.
		const f = await fixture();
		try {
			await change(f);
			const before = await readFile(f.args.sourcePath).catch(() => null);
			// When: capture attempts only read-only validation.
			if (label === "reparse link") {
				await expect(guard({ ...f.args, mode: "capture" })).rejects.toThrow(
					"REPARSE_POINT",
				);
			} else {
				await expect(guard({ ...f.args, mode: "capture" })).rejects.toThrow();
			}
			// Then: neither source nor a sentinel configuration is touched.
			expect(await readFile(f.args.sourcePath).catch(() => null)).toEqual(
				before,
			);
		} finally {
			await rm(f.root, { recursive: true, force: true });
		}
	});
}

test("rejects changed canonical seed at rollback without touching configuration", async () => {
	const f = await fixture();
	try {
		const configuration = join(f.root, "launch.json");
		await writeFile(configuration, "sealed configuration");
		const capture = await guard({ ...f.args, mode: "capture" });
		f.args.action.captureSha256 = digest(JSON.stringify(capture));
		await writeFile(f.args.finalPath, "changed canonical");
		const before = await readFile(f.args.finalPath);
		await expect(
			guard({ ...f.args, mode: "rollback", expected: capture }),
		).rejects.toThrow();
		expect(await readFile(f.args.finalPath)).toEqual(before);
		expect(await readFile(configuration, "utf8")).toBe("sealed configuration");
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

test("rejects mismatched capture receipt", async () => {
	const f = await fixture();
	try {
		const capture = await guard({ ...f.args, mode: "capture" });
		f.args.action.captureSha256 = digest(JSON.stringify(capture));
		await expect(
			guard({
				...f.args,
				mode: "pre-copy",
				expected: { ...capture, sourceSha256: digest("other") },
			}),
		).rejects.toThrow("CAPTURE_BINDING");
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

test("rejects capture replay across identical-byte owned namespaces", async () => {
	const a = await fixture();
	const b = await fixture();
	try {
		const capture = await guard({ ...a.args, mode: "capture" });
		await copyFile(a.args.sourcePath, b.args.sourcePath);
		b.args.plan = a.args.plan;
		b.args.action.planSha256 = digest(JSON.stringify(b.args.plan));
		b.args.action.captureSha256 = digest(JSON.stringify(capture));
		expect(await readFile(b.args.sourcePath)).toEqual(
			await readFile(a.args.sourcePath),
		);
		await expect(
			guard({ ...b.args, mode: "pre-copy", expected: capture }),
		).rejects.toThrow("CAPTURE_BINDING");
	} finally {
		await rm(a.root, { recursive: true, force: true });
		await rm(b.root, { recursive: true, force: true });
	}
});

test("rejects a destination outside its owned synthetic namespace", async () => {
	const a = await fixture();
	const b = await fixture();
	try {
		a.args.finalPath = b.args.finalPath;
		a.args.tempPath = join(b.output, "originals.sqlite.fixture.tmp");
		a.args.action.finalPath = a.args.finalPath;
		a.args.action.tempPath = a.args.tempPath;
		await expect(guard({ ...a.args, mode: "capture" })).rejects.toThrow(
			"SYNTHETIC_SCRATCH_ONLY",
		);
	} finally {
		await rm(a.root, { recursive: true, force: true });
		await rm(b.root, { recursive: true, force: true });
	}
});

test("rejects missing or changed temp without changing source or configuration", async () => {
	const f = await fixture();
	try {
		const capture = await guard({ ...f.args, mode: "capture" });
		f.args.action.captureSha256 = digest(JSON.stringify(capture));
		await expect(
			guard({ ...f.args, mode: "post-copy", expected: capture }),
		).rejects.toThrow("TEMP_REQUIRED");
		await writeFile(f.args.tempPath, "not the source");
		await expect(
			guard({ ...f.args, mode: "post-copy", expected: capture }),
		).rejects.toThrow("SEED_BINDING");
		expect(await readFile(f.args.sourcePath)).toEqual(f.seedBytes);
		expect(await readFile(f.args.tempPath, "utf8")).toBe("not the source");
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

test("rejects unsupported real custody and non-scratch source paths", async () => {
	const f = await fixture();
	try {
		await expect(
			guard({
				...f.args,
				mode: "capture",
				custody: { ...f.args.custody, synthetic: false, accepted: true },
			}),
		).rejects.toThrow("CUSTODY_REQUIRED");
		const outside = join(
			dirname(await realpath(tmpdir())),
			"native-guard-outside-input",
		);
		const sourcePath = join(outside, "originals.sqlite");
		await expect(
			guard({
				...f.args,
				mode: "capture",
				inputRoot: outside,
				sourcePath,
				action: { ...f.args.action, inputRoot: outside, sourcePath },
			}),
		).rejects.toThrow("SYNTHETIC_SCRATCH_ONLY");
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

test("rejects changed historical BLOB hash", async () => {
	// Given: a fixture whose SQLite logical tables are modified after seed capture.
	const f = await fixture();
	try {
		const db = new DatabaseSync(f.args.sourcePath);
		db.exec(
			"INSERT INTO detail_revisions SELECT person_id,2,url,'historical-invalid',x'01' FROM detail_revisions WHERE person_id='person-1'",
		);
		db.close();
		const bytes = await readFile(f.args.sourcePath);
		f.args.plan.seed = { bytes: bytes.length, sha256: digest(bytes) };
		f.args.plan.inputs = [
			{ path: "originals.sqlite", bytes: bytes.length, sha256: digest(bytes) },
		];
		f.args.action.planSha256 = digest(JSON.stringify(f.args.plan));
		// When: read-only logical verification inspects the altered revision.
		await expect(guard({ ...f.args, mode: "capture" })).rejects.toThrow(
			"REVISION_INVALID",
		);
		// Then: the modified fixture remains unchanged by the guard.
		expect(await readFile(f.args.sourcePath)).toEqual(bytes);
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

test("rejects incomplete current selection even with rebound seed hash", async () => {
	const f = await fixture();
	try {
		const db = new DatabaseSync(f.args.sourcePath);
		db.exec("DELETE FROM current_originals WHERE person_id='person-1'");
		db.close();
		const bytes = await readFile(f.args.sourcePath);
		f.args.plan.seed = { bytes: bytes.length, sha256: digest(bytes) };
		f.args.plan.inputs = [
			{ path: "originals.sqlite", bytes: bytes.length, sha256: digest(bytes) },
		];
		f.args.action.planSha256 = digest(JSON.stringify(f.args.plan));
		await expect(guard({ ...f.args, mode: "capture" })).rejects.toThrow(
			"CURRENT_SELECTION_COUNT",
		);
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});
