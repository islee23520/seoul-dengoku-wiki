import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, realpath, readFile, readdir } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export function check(ok, message) {
	if (!ok) throw new Error(message);
}

export function inside(root, path) {
	const rel = relative(root, path);
	return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}

export function portable(path) {
	check(typeof path === 'string' && path.length > 0 && !/[\\:\x00-\x1f]/.test(path), 'Invalid portable path');
	check(path.split('/').every(p => p && p !== '.' && p !== '..' && !/[. ]$/.test(p) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'Invalid portable path');
	check(!isAbsolute(path), 'Absolute path forbidden');
	return path;
}

// Defense in depth for recognizable credential files, not a content-secret scanner.
// Every other byte must still be selected explicitly by the private owner allowlist.
export function allowedPath(path) {
	portable(path);
	check(!path.split('/').some(p => /^(?:\.env(?:\..*)?|\.omo|\.git|\.venv|venv|__pycache__|cache|auth(?:\..*)?|cookies?(?:\..*)?|credentials?(?:\..*)?|secrets?(?:\..*)?|tokens?(?:\..*)?|hmac(?:\..*)?|authority(?:\..*)?|revocations?(?:\..*)?|account(?:\..*)?)$/i.test(p)), 'Credential or operational path forbidden');
	check(!/(?:-wal|-shm|\.lock)$/i.test(path), 'SQLite sidecar/lock forbidden');
}

export async function noLinks(path, missing = false) {
	const full = resolve(path);
	const parent = dirname(full);
	if (parent !== full) await noLinks(parent, missing);
	try {
		check(!(await lstat(full)).isSymbolicLink(), 'Symlink/reparse path forbidden');
	} catch (e) {
		if (!(missing && e.code === 'ENOENT')) throw e;
	}
	return full;
}

export async function fileAt(root, path) {
	portable(path);
	const full = await noLinks(join(root, path));
	check(inside(await realpath(root), await realpath(full)), 'Path escaped root');
	check((await lstat(full)).isFile(), 'Expected regular file');
	return full;
}

export async function fingerprint(path) {
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(path)) { hash.update(chunk); bytes += chunk.length; }
	return { sha256: hash.digest('hex'), bytes };
}

export function same(a, b) {
	return a.sha256 === b.sha256 && a.bytes === b.bytes;
}

export function integrity(path) {
	const db = new DatabaseSync(path, { readOnly: true });
	try {
		const rows = db.prepare('PRAGMA integrity_check').all();
		check(rows.length === 1 && rows[0].integrity_check === 'ok', 'SQLite integrity failed');
		return { userVersion: db.prepare('PRAGMA user_version').get().user_version, schemaVersion: db.prepare('PRAGMA schema_version').get().schema_version };
	} finally { db.close(); }
}

// Private JSON (never commit): { backupRoot, restoreRoot, protectedRoots,
// roots: { 'instance.user': '/canonical/owner/root' }, profiles: { 'comfyui-all':
// { rootRefs: ['instance.user'], files: [{ rootRef, path, kind, stableCutoff }],
// models: [{ rootRef: 'instance.models', path, sha256, bytes }] } } }.
// The owner supplies canonical mappings and ACL-restricted destination roots.
// No recursive root capture, default live paths, or content-secret scanning.
export async function loadProfile(configPath, profile, sourceRequired = true) {
	check(typeof profile === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(profile), 'Invalid profile ID');
	check(configPath, 'Private config required: --config or LOCAL_AI_BACKUP_CONFIG');
	const config = JSON.parse(await readFile(await noLinks(configPath), 'utf8'));
	const selected = config.profiles?.[profile];
	check(selected && Array.isArray(selected.rootRefs) && selected.rootRefs.length && Array.isArray(selected.files) && selected.files.length && Array.isArray(selected.models), 'Missing explicit profile mapping');
	check(isAbsolute(config.backupRoot ?? '') && isAbsolute(config.restoreRoot ?? ''), 'Explicit backupRoot and restoreRoot required');
	check(Array.isArray(config.protectedRoots) && config.protectedRoots.length, 'Explicit protectedRoots required');
	const roots = {};
	for (const ref of selected.rootRefs) {
		check(/^[a-z0-9][a-z0-9.-]*$/.test(ref) && isAbsolute(config.roots?.[ref] ?? ''), 'Missing root mapping');
		roots[ref] = sourceRequired ? await realpath(await noLinks(config.roots[ref])) : resolve(config.roots[ref]);
		check(Object.entries(roots).every(([key, value]) => key === ref || value.toLowerCase() !== roots[ref].toLowerCase()), 'Duplicate root alias');
		if (sourceRequired) check((await lstat(roots[ref])).isDirectory(), 'Mapped root must be directory');
	}
	for (const key of ['backupRoot', 'restoreRoot']) {
		config[key] = await realpath(await noLinks(config[key]));
		check((await lstat(config[key])).isDirectory(), 'Destination root must exist');
	}
	config.protectedRoots = await Promise.all(config.protectedRoots.map(async p => {
		check(isAbsolute(p), 'Protected root must be absolute');
		return sourceRequired ? realpath(await noLinks(p)) : resolve(p);
	}));
	const destinations = new Set();
	for (const entry of [...selected.files, ...selected.models]) {
		check(Object.hasOwn(roots, entry.rootRef), 'Entry missing root mapping');
		allowedPath(entry.path);
		const name = `${entry.rootRef}/${entry.path}`.toLowerCase();
		check(!destinations.has(name), 'Duplicate destination');
		destinations.add(name);
	}
	for (const entry of selected.files) {
		check(['static', 'sqlite', 'prior-bkp', 'local-model'].includes(entry.kind), 'Unsupported capture kind');
		check(!/\.models$/.test(entry.rootRef) || entry.kind === 'local-model', 'Models are reference-only unless explicitly local-only');
		check(entry.kind !== 'local-model' || entry.localOnly === true, 'Local-only model selection required');
		check(!/\.(?:db|sqlite|sqlite3)$/i.test(entry.path) || entry.kind === 'sqlite', 'Database requires online backup');
		check(!/\.bkp$/i.test(entry.path) || entry.kind === 'prior-bkp', 'Original bkp must remain distinct');
		check(entry.kind !== 'prior-bkp' || /\.bkp$/i.test(entry.path), 'Expected original bkp');
		check(entry.kind === 'sqlite' || entry.stableCutoff === true, 'Static capture requires owner-confirmed stableCutoff');
	}
	for (const entry of selected.models) {
		check(/\.models$/.test(entry.rootRef) && /^[a-f0-9]{64}$/.test(entry.sha256) && Number.isSafeInteger(entry.bytes) && entry.bytes >= 0, 'Model reference requires full hash/size');
	}
	return { config, selected, roots, profile };
}

export async function destination(ctx, path, type) {
	check(isAbsolute(path), 'Destination must be absolute');
	path = await noLinks(path, true);
	const boundary = ctx.config[type];
	check(path !== boundary && inside(boundary, path), 'Destination outside private allowlist');
	for (const root of [...Object.values(ctx.roots), ...ctx.config.protectedRoots]) {
		check(!inside(root, path) && !inside(path, root), 'Live/protected root overlap');
	}
	return path;
}

export async function assertEmpty(path) {
	try { check((await lstat(path)).isDirectory() && (await readdir(path)).length === 0, 'Target must be an empty directory'); }
	catch (e) { if (e.code !== 'ENOENT') throw e; }
}

export async function cli(meta, options, run) {
	if (process.argv[1] && meta === pathToFileURL(resolve(process.argv[1])).href) {
		try {
			const { values } = parseArgs({ options: Object.fromEntries(options.map(k => [k, { type: 'string' }])) });
			console.log(JSON.stringify(await run(values)));
		} catch (error) { console.error(`Local AI backup failed: ${error.message}`); process.exitCode = 1; }
	}
}
