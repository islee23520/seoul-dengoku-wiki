import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { PORTRAIT_ACCEPTANCE_CRITERIA } from "./criteria.js";
import {
	evaluatePortraitAcceptance,
	type PortraitAcceptanceResult,
} from "./evaluator-replacement.js";
import { ProportionError, validateProportionProfile } from "./proportion.js";

const usage =
	"usage: portrait-acceptance <image.png> <review.json> <profile.json> <measurement.json> (--character <id> --request <requestId> | --terminal <terminal.json>) --profile-sha <sha256> --position-reference <authority.json>";
const shaSchema = z.string().regex(/^[a-f0-9]{64}$/);
const AuthoritySchema = z.strictObject({
	schema: z.literal(PORTRAIT_ACCEPTANCE_CRITERIA.positionReferenceSchema),
	referenceVersion: z
		.string()
		.min(1)
		.refine((value) => value.trim().length > 0),
	referenceSHA: shaSchema,
	ruleSHA: shaSchema,
});
const EvidenceSchema = z
	.array(z.strictObject({ sha256: shaSchema, path: z.string().min(1) }))
	.min(1);
const TerminalSchema = z.looseObject({
	id: z
		.string()
		.min(1)
		.refine((value) => value.trim().length > 0),
	requestId: z
		.string()
		.min(1)
		.refine((value) => value.trim().length > 0),
});

export type PortraitCliErrorCode =
	| "USAGE"
	| "INVALID_PROFILE_PIN"
	| "INVALID_POSITION_AUTHORITY"
	| "REVIEW_EVIDENCE_REQUIRED"
	| "INVALID_EVIDENCE_PATH"
	| "EVIDENCE_HASH_MISMATCH"
	| "INVALID_TERMINAL_RECEIPT"
	| "INVALID_REVIEW"
	| "INVALID_PROFILE"
	| "INVALID_ARTIFACT"
	| "MISSING_ARTIFACT";

export class PortraitCliError extends Error {
	readonly code: PortraitCliErrorCode;

	constructor(code: PortraitCliErrorCode, message: string) {
		super(message);
		this.name = "PortraitCliError";
		this.code = code;
	}
}

type CommonOptions = Readonly<{
	paths: readonly [
		imagePath: string,
		reviewPath: string,
		profilePath: string,
		measurementPath: string,
	];
	profileSHA: string;
	positionReference: string;
}>;
export type FullAcceptanceOptions = CommonOptions &
	(
		| Readonly<{ mode: "operator"; character: string; request: string }>
		| Readonly<{ mode: "terminal"; terminal: string }>
	);

function failUsage(): never {
	throw new PortraitCliError("USAGE", usage);
}

function parseArgs(args: string[]): FullAcceptanceOptions | "help" {
	if (args.length === 1 && (args[0] === "--help" || args[0] === "-h"))
		return "help";
	const paths: string[] = [];
	const flags = new Map<string, string>();
	const valueFlags = new Set([
		"--character",
		"--request",
		"--terminal",
		"--profile-sha",
		"--position-reference",
	]);
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === undefined) failUsage();
		if (!arg.startsWith("--")) {
			if (arg.startsWith("-")) failUsage();
			paths.push(arg);
			continue;
		}
		if (!valueFlags.has(arg) || flags.has(arg)) failUsage();
		const value = args[++index];
		if (
			!value ||
			(value.startsWith("-") && !shaSchema.safeParse(value).success)
		)
			failUsage();
		flags.set(arg, value);
	}
	const direct = flags.has("--character") || flags.has("--request");
	const terminal = flags.has("--terminal");
	if (
		paths.length !== 4 ||
		direct === terminal ||
		(direct && (!flags.has("--character") || !flags.has("--request"))) ||
		!flags.has("--profile-sha") ||
		!flags.has("--position-reference") ||
		!shaSchema.safeParse(flags.get("--profile-sha")).success
	)
		failUsage();
	const [imagePath, reviewPath, profilePath, measurementPath] = paths;
	if (!imagePath || !reviewPath || !profilePath || !measurementPath)
		failUsage();
	const positionalPaths: CommonOptions["paths"] = [
		imagePath,
		reviewPath,
		profilePath,
		measurementPath,
	];
	const profileSHA = flags.get("--profile-sha");
	const positionReference = flags.get("--position-reference");
	if (!profileSHA || !positionReference) failUsage();
	if (terminal) {
		const terminalPath = flags.get("--terminal");
		if (!terminalPath) failUsage();
		return {
			mode: "terminal",
			paths: positionalPaths,
			terminal: terminalPath,
			profileSHA,
			positionReference,
		};
	}
	const character = flags.get("--character");
	const request = flags.get("--request");
	if (!character?.trim() || !request?.trim()) failUsage();
	return {
		mode: "operator",
		paths: positionalPaths,
		character,
		request,
		profileSHA,
		positionReference,
	};
}

function parseJSON(
	bytes: Uint8Array,
	code: PortraitCliErrorCode,
	error: string,
): unknown {
	try {
		const value: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"));
		return value;
	} catch (cause: unknown) {
		if (cause instanceof SyntaxError) throw new PortraitCliError(code, error);
		throw cause;
	}
}

function operationalErrorCode(error: unknown): string | undefined {
	if (typeof error !== "object" || error === null || !("code" in error))
		return undefined;
	const code = error.code;
	return typeof code === "string" &&
		["ENOENT", "EISDIR", "ENOTDIR", "EACCES", "EPERM"].includes(code)
		? code
		: undefined;
}

export async function readArtifact(path: string): Promise<Buffer> {
	try {
		return await readFile(path);
	} catch (error: unknown) {
		const code = operationalErrorCode(error);
		if (code === "ENOENT")
			throw new PortraitCliError(
				"MISSING_ARTIFACT",
				`missing artifact: ${path}`,
			);
		if (code)
			throw new PortraitCliError(
				"INVALID_ARTIFACT",
				`invalid artifact: ${path}`,
			);
		throw error;
	}
}

async function readEvidenceArtifact(
	path: string,
	itemPath: string,
): Promise<Buffer> {
	try {
		return await readFile(path);
	} catch (cause: unknown) {
		if (operationalErrorCode(cause))
			throw new PortraitCliError(
				"EVIDENCE_HASH_MISMATCH",
				`evidence artifact hash mismatch: ${itemPath}`,
			);
		throw cause;
	}
}

export async function executeFullAcceptance(
	options: FullAcceptanceOptions,
): Promise<PortraitAcceptanceResult> {
	const [imagePath, reviewPath, profilePath, measurementPath] = options.paths;
	const [
		imageBytes,
		reviewBytes,
		profileBytes,
		measurementBytes,
		authorityBytes,
	] = await Promise.all([
		readArtifact(imagePath),
		readArtifact(reviewPath),
		readArtifact(profilePath),
		readArtifact(measurementPath),
		readArtifact(options.positionReference),
	]);
	if (
		createHash("sha256").update(profileBytes).digest("hex") !==
		options.profileSHA
	)
		throw new PortraitCliError(
			"INVALID_PROFILE_PIN",
			"profile authority pin mismatch",
		);
	const authority = AuthoritySchema.safeParse(
		parseJSON(
			authorityBytes,
			"INVALID_POSITION_AUTHORITY",
			"invalid position authority",
		),
	);
	if (!authority.success)
		throw new PortraitCliError(
			"INVALID_POSITION_AUTHORITY",
			"invalid position authority",
		);
	const review = parseJSON(
		reviewBytes,
		"INVALID_REVIEW",
		"invalid review artifact",
	);
	const reviewEvidence = z
		.looseObject({ evidence: z.unknown() })
		.safeParse(review);
	const evidenceResult = EvidenceSchema.safeParse(
		reviewEvidence.success ? reviewEvidence.data.evidence : undefined,
	);
	if (!evidenceResult.success)
		throw new PortraitCliError(
			"REVIEW_EVIDENCE_REQUIRED",
			"review evidence artifacts required",
		);
	const evidence: Uint8Array[] = [];
	for (const item of evidenceResult.data) {
		if (isAbsolute(item.path) || item.path.split(/[\\/]/).includes(".."))
			throw new PortraitCliError(
				"INVALID_EVIDENCE_PATH",
				"invalid evidence path",
			);
		const evidencePath = resolve(dirname(reviewPath), item.path);
		const rel = relative(resolve(dirname(reviewPath)), evidencePath);
		if (!rel || rel.startsWith("..") || isAbsolute(rel))
			throw new PortraitCliError(
				"INVALID_EVIDENCE_PATH",
				"invalid evidence path",
			);
		const bytes = await readEvidenceArtifact(evidencePath, item.path);
		if (createHash("sha256").update(bytes).digest("hex") !== item.sha256)
			throw new PortraitCliError(
				"EVIDENCE_HASH_MISMATCH",
				`evidence artifact hash mismatch: ${item.path}`,
			);
		evidence.push(bytes);
	}
	let characterId: string;
	let requestId: string;
	if (options.mode === "terminal") {
		const terminal = TerminalSchema.safeParse(
			parseJSON(
				await readArtifact(options.terminal),
				"INVALID_TERMINAL_RECEIPT",
				"invalid terminal receipt",
			),
		);
		if (!terminal.success)
			throw new PortraitCliError(
				"INVALID_TERMINAL_RECEIPT",
				"invalid terminal receipt",
			);
		characterId = terminal.data.id;
		requestId = terminal.data.requestId;
	} else {
		characterId = options.character;
		requestId = options.request;
	}
	const verdict = evaluatePortraitAcceptance({
		characterId,
		requestId,
		imageBytes,
		review,
		profile: parseJSON(
			profileBytes,
			"INVALID_PROFILE",
			"invalid profile artifact",
		),
		measurementBytes,
		evidence,
		expectedPositionReference: {
			referenceVersion: authority.data.referenceVersion,
			referenceSHA: authority.data.referenceSHA,
			ruleSHA: authority.data.ruleSHA,
		},
	});
	return verdict;
}

export async function runFullAcceptanceCLI(args: string[]): Promise<number> {
	try {
		const options = parseArgs(args);
		if (options === "help") {
			process.stdout.write(`${usage}\n`);
			return 0;
		}
		const verdict = await executeFullAcceptance(options);
		process.stdout.write(`${JSON.stringify(verdict)}\n`);
		return verdict.pass ? 0 : 1;
	} catch (error: unknown) {
		if (!(error instanceof PortraitCliError)) throw error;
		process.stderr.write(`${error.message}\n`);
		return 1;
	}
}

export type BatchHoldCode =
	| "TERMINAL_RECONCILIATION_REQUIRED"
	| "INVALID_REVIEW"
	| "INVALID_ARTIFACT"
	| "OPERATOR_PINS_REQUIRED"
	| "PROFILE_PIN_MISMATCH"
	| "PROFILE_MISMATCH"
	| "POSITION_PIN_MISMATCH"
	| "EVIDENCE_REQUIRED"
	| "INVALID_EVIDENCE_PATH"
	| "EVIDENCE_HASH_MISMATCH"
	| "ACCEPTANCE_FAILED";

export class BatchHoldError extends Error {
	readonly code: BatchHoldCode;

	constructor(code: BatchHoldCode, message: string) {
		super(
			message.startsWith("batch held:") ? message : `batch held: ${message}`,
		);
		this.name = "BatchHoldError";
		this.code = code;
	}
}

const BatchPositionReferenceSchema = z.strictObject({
	referenceVersion: z.string().min(1),
	referenceSHA: z.string().regex(/^[a-f0-9]{64}$/),
	ruleSHA: z.string().regex(/^[a-f0-9]{64}$/),
});
const BatchEvidenceSchema = z
	.array(
		z.strictObject({
			sha256: z.string().regex(/^[a-f0-9]{64}$/),
			path: z.string().min(1),
		}),
	)
	.min(1);
const BatchTerminalSchema = z.looseObject({
	result: z.looseObject({ path: z.string().min(1).optional() }).optional(),
	error: z.unknown().optional(),
	status: z.unknown().optional(),
	id: z.string().min(1),
	requestId: z.string().min(1),
});
const BatchReviewSchema = z.looseObject({
	characterId: z.string().min(1),
	requestId: z.string().min(1),
	sha256: z.string().regex(/^[a-f0-9]{64}$/),
	evidence: z.unknown(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingFile(error: unknown): boolean {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readBatchJSON(path: string): Promise<unknown> {
	try {
		const value: unknown = JSON.parse(await readFile(path, "utf8"));
		return value;
	} catch (error: unknown) {
		if (error instanceof SyntaxError || isMissingFile(error))
			throw new BatchHoldError("INVALID_ARTIFACT", `invalid artifact ${path}`);
		throw error;
	}
}

export async function requireBatchReviewIngress(
	terminal: unknown,
	reviewPath: string,
	proportionRequirement: unknown,
): Promise<PortraitAcceptanceResult> {
	const terminalResult = BatchTerminalSchema.safeParse(terminal);
	if (
		!terminalResult.success ||
		!terminalResult.data.result?.path ||
		terminalResult.data.error ||
		terminalResult.data.status === "FAILED" ||
		terminalResult.data.status === "DISPATCHED_RESPONSE_UNKNOWN"
	)
		throw new BatchHoldError(
			"TERMINAL_RECONCILIATION_REQUIRED",
			"failed or unknown response requires reconciliation",
		);

	const reviewValue = await readBatchJSON(reviewPath);
	const reviewResult = BatchReviewSchema.safeParse(reviewValue);
	if (!reviewResult.success)
		throw new BatchHoldError(
			"INVALID_REVIEW",
			"exact image-bound review required",
		);
	const review = reviewResult.data;
	if (
		review.characterId !== terminalResult.data.id ||
		review.requestId !== terminalResult.data.requestId ||
		review.sha256 !==
			createHash("sha256")
				.update(await readFile(terminalResult.data.result.path))
				.digest("hex")
	)
		throw new BatchHoldError(
			"INVALID_REVIEW",
			"exact image-bound review required",
		);

	if (!isRecord(proportionRequirement))
		throw new BatchHoldError(
			"OPERATOR_PINS_REQUIRED",
			"operator-pinned profile and position authority required",
		);
	const {
		profilePath,
		profileFileSHA,
		positionReference,
		measurementPath,
		profile: suppliedProfile,
	} = proportionRequirement;
	if (
		typeof profilePath !== "string" ||
		typeof profileFileSHA !== "string" ||
		typeof measurementPath !== "string" ||
		!positionReference
	)
		throw new BatchHoldError(
			"OPERATOR_PINS_REQUIRED",
			"operator-pinned profile and position authority required",
		);
	const positionResult =
		BatchPositionReferenceSchema.safeParse(positionReference);
	if (!positionResult.success)
		throw new BatchHoldError(
			"OPERATOR_PINS_REQUIRED",
			"operator-pinned profile and position authority required",
		);
	const profileBytes = await readFile(profilePath).catch((error: unknown) => {
		if (isMissingFile(error))
			throw new BatchHoldError(
				"INVALID_ARTIFACT",
				`invalid artifact ${profilePath}`,
			);
		throw error;
	});
	if (
		!/^[a-f0-9]{64}$/.test(profileFileSHA) ||
		createHash("sha256").update(profileBytes).digest("hex") !== profileFileSHA
	)
		throw new BatchHoldError(
			"PROFILE_PIN_MISMATCH",
			"profile authority pin mismatch",
		);
	let pinnedProfile: unknown;
	try {
		pinnedProfile = JSON.parse(profileBytes.toString("utf8"));
		validateProportionProfile(pinnedProfile);
	} catch (error: unknown) {
		if (error instanceof SyntaxError || error instanceof ProportionError)
			throw new BatchHoldError(
				"INVALID_ARTIFACT",
				`invalid artifact ${profilePath}`,
			);
		throw error;
	}
	if (
		suppliedProfile !== undefined &&
		!isDeepStrictEqual(suppliedProfile, pinnedProfile)
	)
		throw new BatchHoldError(
			"PROFILE_MISMATCH",
			"pinned profile differs from supplied profile",
		);

	const evidenceResult = BatchEvidenceSchema.safeParse(review.evidence);
	if (!evidenceResult.success)
		throw new BatchHoldError(
			"EVIDENCE_REQUIRED",
			"review evidence artifacts required",
		);
	const evidence: Uint8Array[] = [];
	for (const entry of evidenceResult.data) {
		if (isAbsolute(entry.path) || entry.path.split(/[\\/]/).includes(".."))
			throw new BatchHoldError(
				"INVALID_EVIDENCE_PATH",
				`invalid evidence path ${entry.path}`,
			);
		const path = resolve(dirname(reviewPath), entry.path);
		if (!path.startsWith(`${resolve(dirname(reviewPath))}${sep}`))
			throw new BatchHoldError(
				"INVALID_EVIDENCE_PATH",
				`invalid evidence path ${entry.path}`,
			);
		const bytes = await readFile(path).catch((error: unknown) => {
			if (isMissingFile(error))
				throw new BatchHoldError(
					"INVALID_ARTIFACT",
					`missing evidence artifact ${entry.path}`,
				);
			throw error;
		});
		if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256)
			throw new BatchHoldError(
				"EVIDENCE_HASH_MISMATCH",
				`evidence artifact hash mismatch ${entry.path}`,
			);
		evidence.push(bytes);
	}
	const imageBytes = await readFile(terminalResult.data.result.path);
	let measurementBytes: Uint8Array;
	try {
		measurementBytes = await readFile(measurementPath);
	} catch (error: unknown) {
		if (isMissingFile(error))
			throw new BatchHoldError(
				"INVALID_ARTIFACT",
				`invalid measurement artifact ${measurementPath}`,
			);
		throw error;
	}
	const verdict = evaluatePortraitAcceptance({
		characterId: terminalResult.data.id,
		requestId: terminalResult.data.requestId,
		imageBytes,
		review: reviewValue,
		profile: pinnedProfile,
		measurementBytes,
		evidence,
		expectedPositionReference: positionResult.data,
	});
	if (!verdict.pass)
		throw new BatchHoldError(
			"ACCEPTANCE_FAILED",
			`acceptance failed: ${verdict.failures.join(", ")}`,
		);
	return verdict;
}
