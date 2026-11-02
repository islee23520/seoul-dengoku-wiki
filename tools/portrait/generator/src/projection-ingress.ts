import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
	operatorPinsSchema,
	PreflightError,
	portraitCandidateSchema,
	positionMetricsSchema,
	preparePortraitConditions,
} from "./preflight.js";

export const createProjectionInputSchema = () =>
	z
		.object({
			candidate: portraitCandidateSchema,
			operatorPins: operatorPinsSchema,
			prepared: z
				.object({
					artifactHashes: z
						.object({
							rule: z.string().regex(/^[a-f0-9]{64}$/),
							positionReference: z.string().regex(/^[a-f0-9]{64}$/),
							look: z.string().regex(/^[a-f0-9]{64}$/),
							referenceImages: z.array(z.string().regex(/^[a-f0-9]{64}$/)),
						})
						.strict(),
					positionMetrics: positionMetricsSchema,
					providerCalls: z.literal(0),
					dispatched: z.literal(false),
				})
				.strict(),
		})
		.strict();

export type ProjectionErrorCode =
	| "PREPARED_CONDITIONS_MISMATCH"
	| "INVALID_LOOK"
	| "INVALID_PROJECTION_INPUT";

export class ProjectionError extends Error {
	readonly code: ProjectionErrorCode;

	constructor(code: ProjectionErrorCode) {
		super(code);
		this.name = "ProjectionError";
		this.code = code;
	}
}

export const parseBoundJson = <T>(
	bytes: Uint8Array,
	schema: z.ZodType<T>,
): T => {
	const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	const parsed: unknown = JSON.parse(text);
	const stack: (Set<string> | null)[] = [];
	for (let index = 0; index < text.length; index += 1) {
		const character = text[index];
		if (character === "{") stack.push(new Set());
		else if (character === "[") stack.push(null);
		else if (character === "}" || character === "]") stack.pop();
		else if (character === '"') {
			const start = index;
			index += 1;
			while (index < text.length) {
				if (text[index] === "\\") index += 2;
				else if (text[index] === '"') break;
				else index += 1;
			}
			if (
				text
					.slice(index + 1)
					.trimStart()
					.startsWith(":")
			) {
				const parent = stack.at(-1);
				if (parent === null || parent === undefined) continue;
				const key: unknown = JSON.parse(text.slice(start, index + 1));
				if (typeof key !== "string") continue;
				if (parent.has(key)) throw new PreflightError("DUPLICATE_JSON_KEY");
				parent.add(key);
			}
		}
	}
	return schema.parse(parsed);
};

export function assertPreparedProjection(input: unknown): void {
	const projectionInputSchema = createProjectionInputSchema();
	let parsed: z.infer<typeof projectionInputSchema>;
	try {
		parsed = projectionInputSchema.parse(input);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new ProjectionError("INVALID_PROJECTION_INPUT");
		}
		throw error;
	}
	const prepared = preparePortraitConditions(
		parsed.candidate,
		parsed.operatorPins,
	);
	if (!isDeepStrictEqual(prepared, parsed.prepared)) {
		throw new ProjectionError("PREPARED_CONDITIONS_MISMATCH");
	}
}
