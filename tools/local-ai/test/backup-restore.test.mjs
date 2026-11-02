import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, symlink, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { backup } from '../backup.mjs';
import { restore } from '../restore.mjs';
import { verifyBackup } from '../verify-backup.mjs';
import { fingerprint } from '../backup-common.mjs';

const exec = promisify(execFile);
const scripts = dirname(dirname(fileURLToPath(import.meta.url)));

async function fixture(t) {
	const base = await mkdtemp(join(tmpdir(), 'local-ai-task8-'));
	let db;
	t.after(async () => { if (db?.isOpen) db.close(); await rm(base, { recursive: true, force: true }); });
	const source = join(base, 'source');
	const models = join(base, 'models');
	const backups = join(base, 'backups');
	const restores = join(base, 'restores');
	for (const path of [source, models, backups, restores]) await mkdir(path);
	await writeFile(join(source, 'workflow.json'), '{"owned":"workflow bytes"}\n');
	await writeFile(join(source, 'state.db.bkp'), 'original migration backup bytes');
	await writeFile(join(source, '.env'), 'CANARY_ENV_DO_NOT_COLLECT');
	await writeFile(join(source, 'auth.json'), 'CANARY_AUTH_DO_NOT_COLLECT');
	await writeFile(join(source, 'unselected.txt'), 'CANARY_UNSELECTED_DO_NOT_COLLECT');
	await writeFile(join(models, 'public.bin'), 'immutable model');
	await writeFile(join(models, 'own-lora.bin'), 'local-only model bytes');
	db = new DatabaseSync(join(source, 'state.db'));
	db.exec("PRAGMA journal_mode=WAL; PRAGMA user_version=7; CREATE TABLE jobs(value TEXT); INSERT INTO jobs VALUES ('preserved WAL row');");
	const mapping = {
		backupRoot: backups, restoreRoot: restores, protectedRoots: [source, models],
		roots: { 'fixture.user': source, 'fixture.models': models },
		profiles: { 'comfyui-all': {
			rootRefs: ['fixture.user', 'fixture.models'],
			files: [
				{ rootRef: 'fixture.user', path: 'workflow.json', kind: 'static', stableCutoff: true },
				{ rootRef: 'fixture.user', path: 'state.db', kind: 'sqlite' },
				{ rootRef: 'fixture.user', path: 'state.db.bkp', kind: 'prior-bkp', stableCutoff: true },
				{ rootRef: 'fixture.models', path: 'own-lora.bin', kind: 'local-model', localOnly: true, stableCutoff: true },
			],
			models: [{ rootRef: 'fixture.models', path: 'public.bin', ...await fingerprint(join(models, 'public.bin')) }],
		} },
	};
	const config = join(base, 'private-config.json');
	await writeFile(config, JSON.stringify(mapping));
	return { base, source, models, backups, restores, config, mapping, profile: 'comfyui-all', output: join(backups, 'snapshot'), target: join(restores, 'isolated') };
}

test('real CLI file/online WAL SQLite roundtrip, explicit model references, canary exclusion and cleanup', async t => {
	const f = await fixture(t);
	const invocations = [
		['backup.mjs', '--profile', f.profile, '--output', f.output],
		['verify-backup.mjs', '--backup', f.output],
		['restore.mjs', '--backup', f.output, '--target', f.target],
	];
	for (const args of invocations) {
		const result = await exec(process.execPath, [join(scripts, args[0]), ...args.slice(1)], { env: { ...process.env, LOCAL_AI_BACKUP_CONFIG: f.config }, timeout: 15000 });
		assert.ok(JSON.parse(result.stdout));
		console.log(`CLI exit=0 ${args[0]} ${result.stdout.trim()}`);
	}
	const manifest = await verifyBackup({ backup: f.output });
	assert.equal(manifest.files.length, 4);
	assert.equal(manifest.models.length, 1);
	const serialized = JSON.stringify(manifest);
	assert.ok(!serialized.includes(f.base));
	assert.ok(!serialized.includes('CANARY'));
	assert.deepEqual((await readdir(join(f.output, 'files', 'fixture.user'))).sort(), ['state.db', 'state.db.bkp', 'workflow.json']);
	for (const [root, name] of [['fixture.user', 'workflow.json'], ['fixture.user', 'state.db.bkp'], ['fixture.models', 'own-lora.bin']]) {
		assert.deepEqual(await readFile(join(f.target, root, name)), await readFile(join(root.endsWith('models') ? f.models : f.source, name)));
	}
	assert.deepEqual(await readdir(join(f.target, 'fixture.models')), ['own-lora.bin']);
	const restored = new DatabaseSync(join(f.target, 'fixture.user', 'state.db'), { readOnly: true });
	try {
		assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
		assert.equal(restored.prepare('PRAGMA user_version').get().user_version, 7);
		assert.equal(restored.prepare('SELECT value FROM jobs').get().value, 'preserved WAL row');
	} finally { restored.close(); }
	console.log('Recovered bytes identical; SQLite integrity=ok, user_version=7, WAL row preserved; fixture removed by test cleanup.');
});

test('tamper, traversal, extra credential file and target boundaries fail before writes', async t => {
	const f = await fixture(t);
	await backup(f);
	const manifestPath = join(f.output, 'manifest.json');
	const original = await readFile(manifestPath, 'utf8');
	const payload = join(f.output, 'files', 'fixture.user', 'workflow.json');
	const originalBytes = await readFile(payload);
	await writeFile(payload, 'tampered');
	await assert.rejects(restore({ ...f, backup: f.output }), /mismatch/);
	assert.deepEqual(await readdir(f.restores), []);
	await writeFile(payload, originalBytes);
	const manifest = JSON.parse(original);
	manifest.files[0].path = '../escaped';
	await writeFile(manifestPath, JSON.stringify(manifest));
	await assert.rejects(restore({ ...f, backup: f.output }), /portable path/);
	await writeFile(manifestPath, original);
	await writeFile(join(f.output, '.env'), 'CANARY_EXTRA');
	await assert.rejects(restore({ ...f, backup: f.output }), /Unexpected backup file/);
	await rm(join(f.output, '.env'));
	for (const target of [f.source, f.restores, join(f.base, 'outside')]) {
		await assert.rejects(restore({ ...f, backup: f.output, target }), /allowlist|overlap/);
	}
	await mkdir(f.target);
	await writeFile(join(f.target, 'keep'), 'untouched');
	await assert.rejects(restore({ ...f, backup: f.output }), /empty directory/);
	assert.deepEqual(await readdir(f.target), ['keep']);
	await rm(f.target, { recursive: true });
	await symlink(f.source, f.target, process.platform === 'win32' ? 'junction' : 'dir');
	await assert.rejects(restore({ ...f, backup: f.output }), /Symlink/);
	await rm(f.target);
	// Model references still require only the immutable store, not original user bytes.
	await rename(join(f.source, 'workflow.json'), join(f.source, 'unavailable-workflow.json'));
	await restore({ ...f, backup: f.output });
	assert.equal((await readFile(join(f.target, 'fixture.user', 'workflow.json'), 'utf8')), '{"owned":"workflow bytes"}\n');
});

test('private mapping is mandatory; explicit credential, traversal, raw DB and symlink source selections are refused', async t => {
	const f = await fixture(t);
	await assert.rejects(backup({ profile: f.profile, output: f.output }), /Private config required/);
	const profile = f.mapping.profiles[f.profile];
	const original = structuredClone(profile.files);
	for (const entry of [
		{ path: '.env', kind: 'static' },
		{ path: 'auth.json', kind: 'static' },
		{ path: '../unselected.txt', kind: 'static' },
		{ path: 'state.db', kind: 'static' },
	]) {
		profile.files = [{ rootRef: 'fixture.user', stableCutoff: true, ...entry }];
		await writeFile(f.config, JSON.stringify(f.mapping));
		await assert.rejects(backup(f), /forbidden|portable path|online backup/);
	}
	profile.files = original;
	delete f.mapping.roots['fixture.user'];
	await writeFile(f.config, JSON.stringify(f.mapping));
	await assert.rejects(backup(f), /Missing root mapping/);
	f.mapping.roots['fixture.user'] = f.source;
	profile.files = [{ rootRef: 'fixture.user', path: 'escape/workflow.json', kind: 'static', stableCutoff: true }];
	await symlink(f.models, join(f.source, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
	await writeFile(f.config, JSON.stringify(f.mapping));
	await assert.rejects(backup(f), /Symlink/);
});
