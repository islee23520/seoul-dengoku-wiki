import { constants } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { assertEmpty, check, cli, destination, fileAt, fingerprint, inside, loadProfile, same } from './backup-common.mjs';
import { verifyBackup } from './verify-backup.mjs';

export async function restore({ backup, target, config = process.env.LOCAL_AI_BACKUP_CONFIG }) {
	check(backup && target, '--backup and --target required');
	// All backup bytes and SQLite integrity are checked before any target write.
	const manifest = await verifyBackup({ backup });
	const ctx = await loadProfile(config, manifest.profile, false);
	target = await destination(ctx, target, 'restoreRoot');
	check(!inside(resolve(backup), target) && !inside(target, resolve(backup)), 'Backup/target overlap');
	await assertEmpty(target);
	check(manifest.files.length === ctx.selected.files.length && manifest.models.length === ctx.selected.models.length, 'Backup/profile selection mismatch');
	for (const entry of ctx.selected.files) {
		check(manifest.files.some(e => e.path === `${entry.rootRef}/${entry.path}` && e.kind === entry.kind), 'Backup entry not allowlisted');
	}
	for (const model of ctx.selected.models) {
		check(manifest.models.some(e => e.rootRef === model.rootRef && e.path === model.path && same(e, model)), 'Model reference mismatch');
		check(same(model, await fingerprint(await fileAt(ctx.roots[model.rootRef], model.path))), 'Immutable model missing or mismatched');
	}
	await mkdir(target, { recursive: true, mode: 0o700 });
	for (const entry of manifest.files) {
		const source = await fileAt(resolve(backup), `files/${entry.path}`);
		const dest = join(target, entry.path);
		await mkdir(dirname(dest), { recursive: true, mode: 0o700 });
		await copyFile(source, dest, constants.COPYFILE_EXCL);
		check(same(entry, await fingerprint(dest)), 'Restored bytes mismatch');
	}
	return { restored: true, files: manifest.files.length, modelsReferenced: manifest.models.length };
}

await cli(import.meta.url, ['backup', 'target', 'config'], restore);
