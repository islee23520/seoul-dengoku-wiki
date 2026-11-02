declare module "*neutral-slots.mjs" {
	export function neutralRecord(
		input: Record<string, unknown>,
		slotOverrides?: Record<string, Record<string, unknown>>,
	): {
		characterId: string;
		name: string;
		slots: Record<string, Record<string, unknown>>;
		[key: string]: unknown;
	};
}
