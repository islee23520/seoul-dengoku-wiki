import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { localConnectSchema } from "./connections.ts";
import {
	defaultProviderModel,
	providerModelSchema,
} from "./provider-models.ts";

export const accountConnectSchema = localConnectSchema.extend({
	model: providerModelSchema.default(defaultProviderModel),
});
const entrySchema = accountConnectSchema.extend({
	connectedAt: z.iso.datetime(),
	connectedFrom: z.literal("owner-api"),
});
const storeSchema = z.strictObject({
	schema: z.literal("portal-provider-connections.v1"),
	accounts: z.record(z.email(), entrySchema),
});

export function createProviderConnections(storagePath: string | null) {
	const path = storagePath
		? join(storagePath, "provider-connections.json")
		: null;
	let data: z.infer<typeof storeSchema> = {
		schema: "portal-provider-connections.v1",
		accounts: {},
	};
	if (path) {
		try {
			data = storeSchema.parse(JSON.parse(readFileSync(path, "utf8")));
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "ENOENT")
			)
				throw Error("PROVIDER_CONNECTIONS_INVALID");
		}
	}
	return {
		get(login: string) {
			return Object.hasOwn(data.accounts, login)
				? data.accounts[login]
				: undefined;
		},
		set(login: string, input: z.infer<typeof accountConnectSchema> | null) {
			if (!path || !storagePath) throw Error("STORAGE_NOT_CONFIGURED");
			const accounts = { ...data.accounts };
			if (input)
				accounts[login] = {
					...input,
					connectedAt: new Date().toISOString(),
					connectedFrom: "owner-api",
				};
			else delete accounts[login];
			const next = storeSchema.parse({ ...data, accounts });
			mkdirSync(storagePath, { recursive: true, mode: 0o700 });
			writeFileSync(`${path}.tmp`, `${JSON.stringify(next)}\n`, {
				mode: 0o600,
			});
			renameSync(`${path}.tmp`, path);
			data = next;
		},
	};
}
