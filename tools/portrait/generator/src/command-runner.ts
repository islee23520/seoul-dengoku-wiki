import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { z } from "zod";

const connectionSchema = z
	.object({
		baseUrl: z.url(),
		apiKeyEnv: z
			.string()
			.regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
			.optional(),
		allowUnauthenticated: z.boolean().optional(),
	})
	.strict();

const manifestSchema = z
	.object({
		rule: z.object({ path: z.string() }).strict(),
		reference: z.object({ path: z.string() }).strict(),
		look: z.object({ path: z.string() }).strict(),
		referenceImages: z.array(
			z
				.object({
					id: z.string(),
					role: z.string(),
					sameOwnerRecipient: z.boolean().optional(),
					allowedProperties: z.array(z.string()).optional(),
					sourceHash: z.string().optional(),
					path: z.string(),
				})
				.strict(),
		),
		composition: z.unknown(),
	})
	.strict();

type CommonArguments = Readonly<{
	input: string;
	connection: string;
	requestId: string;
	output: string;
}>;
type Arguments =
	| Readonly<{ command: "help" }>
	| Readonly<{ command: "preflight"; input: string; pins: string }>
	| (CommonArguments & Readonly<{ command: "generate"; pins: string }>)
	| (CommonArguments &
			Readonly<{
				command: "generate-reviewed";
				pins?: string;
				previous: string;
				review: string;
				profile: string;
				profileSHA?: string;
				measurement: string;
				positionReference: string;
			}>);

const errorCodes = [
	"INVALID_ARGUMENTS",
	"INVALID_JSON",
	"FILE_READ_FAILED",
	"INVALID_MANIFEST_PATH",
	"INVALID_MANIFEST",
	"INVALID_ARTIFACT",
	"INVALID_CONNECTION",
	"MISSING_API_KEY",
] as const;
type CliErrorCode = (typeof errorCodes)[number];

class CliError extends Error {
	readonly code: CliErrorCode;
	constructor(code: CliErrorCode) {
		super(code);
		this.code = code;
	}
}

const usage =
	"Usage: portrait-generator preflight --input <manifest.json> --pins <operator-pins.json>\n       portrait-generator generate --input <manifest.json> --pins <operator-pins.json> --connection <connection.json> --request-id <id> --output <portrait.png>\n       portrait-generator generate-reviewed --input <manifest.json> --pins <next-operator-pins.json> --connection <connection.json> --request-id <id> --output <portrait.png> --previous <terminal.json> --review <review.json> --profile <profile.json> --profile-sha <sha256> --measurement <measurement.json> --position-reference <authority-triple.json>\n       portrait-generator --help";

function parseArguments(argv: readonly string[]): Arguments {
	const [first, ...rest] = argv;
	if (first === "--help" || first === "-h" || first === "help") {
		if (rest.length !== 0) throw new CliError("INVALID_ARGUMENTS");
		return { command: "help" };
	}
	if (
		first !== "preflight" &&
		first !== "generate" &&
		first !== "generate-reviewed"
	)
		throw new CliError("INVALID_ARGUMENTS");
	const options = new Map<string, string>();
	const allowed = new Set([
		"--input",
		"--pins",
		"--connection",
		"--request-id",
		"--output",
		"--previous",
		"--review",
		"--profile",
		"--profile-sha",
		"--measurement",
		"--position-reference",
	]);
	for (let index = 0; index < rest.length; index += 2) {
		const key = rest[index];
		const value = rest[index + 1];
		if (
			key === undefined ||
			value === undefined ||
			!allowed.has(key) ||
			options.has(key)
		)
			throw new CliError("INVALID_ARGUMENTS");
		options.set(key, value);
	}
	const required = ["--input"];
	if (first === "preflight") required.push("--pins");
	if (first === "generate")
		required.push("--pins", "--connection", "--request-id", "--output");
	if (first === "generate-reviewed")
		required.push(
			"--connection",
			"--request-id",
			"--output",
			"--previous",
			"--review",
			"--profile",
			"--measurement",
			"--position-reference",
		);
	if (required.some((key) => !options.has(key)))
		throw new CliError("INVALID_ARGUMENTS");
	const input = options.get("--input");
	const pins = options.get("--pins");
	const connection = options.get("--connection");
	const requestId = options.get("--request-id");
	const output = options.get("--output");
	const previous = options.get("--previous");
	const review = options.get("--review");
	const profile = options.get("--profile");
	const profileSHA = options.get("--profile-sha");
	const measurement = options.get("--measurement");
	const positionReference = options.get("--position-reference");
	if ([...options.values()].some((value) => value.trim() === ""))
		throw new CliError("INVALID_ARGUMENTS");
	if (
		input === undefined ||
		(first !== "generate-reviewed" && pins === undefined)
	)
		throw new CliError("INVALID_ARGUMENTS");
	if (first === "preflight") {
		if (pins === undefined) throw new CliError("INVALID_ARGUMENTS");
		return { command: first, input, pins };
	}
	if (
		connection === undefined ||
		requestId === undefined ||
		output === undefined ||
		requestId.startsWith("--")
	)
		throw new CliError("INVALID_ARGUMENTS");
	if (first === "generate")
		return {
			command: first,
			input,
			pins: pins ?? "",
			connection,
			requestId,
			output,
		};
	if (
		previous === undefined ||
		review === undefined ||
		profile === undefined ||
		measurement === undefined ||
		positionReference === undefined
	)
		throw new CliError("INVALID_ARGUMENTS");
	return {
		command: first,
		input,
		...(pins === undefined ? {} : { pins }),
		connection,
		requestId,
		output,
		previous,
		review,
		profile,
		...(profileSHA === undefined ? {} : { profileSHA }),
		measurement,
		positionReference,
	};
}

function safeArtifactPath(manifestPath: string, artifactPath: string): string {
	if (isAbsolute(artifactPath) || artifactPath.split(/[\\/]/).includes(".."))
		throw new CliError("INVALID_MANIFEST_PATH");
	const manifestDirectory = resolve(dirname(manifestPath));
	const resolved = resolve(manifestDirectory, artifactPath);
	if (!resolved.startsWith(`${manifestDirectory}${sep}`))
		throw new CliError("INVALID_MANIFEST_PATH");
	return resolved;
}

export async function runPortraitCommand(
	argv: readonly string[],
): Promise<void> {
	if (
		("bun" in process.versions && process.execArgv[0] === "-") ||
		process.execArgv.some(
			(arg) =>
				["-e", "--eval", "-p", "--print", "--input-type"].includes(arg) ||
				arg.startsWith("--eval=") ||
				arg.startsWith("--print=") ||
				arg.startsWith("--input-type="),
		)
	)
		return;
	const { BatchHoldError } = await import("portrait-acceptance");
	const {
		operatorPinsSchema,
		PreflightError,
		parseBoundJson,
		portraitCandidateSchema,
		preparePortraitConditions,
	} = await import("./preflight.js");
	const { ProjectionError, projectPortrait } = await import("./projection.js");
	const { dispatchAfterBatchReview } = await import("./review-dispatch.js");
	const { sendPortraitRequest, TransportError } = await import(
		"./transport.js"
	);
	async function readJson(path: string): Promise<unknown> {
		try {
			return parseBoundJson(await readFile(path), z.unknown());
		} catch (error) {
			if (error instanceof CliError || error instanceof PreflightError)
				throw error;
			if (
				error instanceof SyntaxError ||
				error instanceof TypeError ||
				error instanceof z.ZodError
			)
				throw new CliError("INVALID_JSON");
			if (
				error instanceof Error &&
				"code" in error &&
				["ENOENT", "EISDIR"].includes(String(error.code))
			)
				throw new CliError("FILE_READ_FAILED");
			throw error;
		}
	}

	try {
		const args = parseArguments(argv);
		if (args.command === "help") {
			process.stdout.write(`${usage}\n`);
			return;
		}
		const rawManifest = await readJson(args.input);
		let manifest: z.infer<typeof manifestSchema>;
		try {
			manifest = manifestSchema.parse(rawManifest);
		} catch (error) {
			if (error instanceof z.ZodError) throw new CliError("INVALID_MANIFEST");
			throw error;
		}
		let ruleBytes: Buffer;
		let positionReferenceBytes: Buffer;
		let lookBytes: Buffer;
		let referenceBytes: Buffer[];
		try {
			[ruleBytes, positionReferenceBytes, lookBytes, ...referenceBytes] =
				await Promise.all([
					readFile(safeArtifactPath(args.input, manifest.rule.path)),
					readFile(safeArtifactPath(args.input, manifest.reference.path)),
					readFile(safeArtifactPath(args.input, manifest.look.path)),
					...manifest.referenceImages.map((image) =>
						readFile(safeArtifactPath(args.input, image.path)),
					),
				]);
		} catch (error) {
			if (error instanceof CliError) throw error;
			if (
				error instanceof Error &&
				"code" in error &&
				["ENOENT", "EISDIR"].includes(String(error.code))
			)
				throw new CliError("FILE_READ_FAILED");
			throw error;
		}
		let candidate: z.infer<typeof portraitCandidateSchema>;
		try {
			candidate = portraitCandidateSchema.parse({
				ruleBytes,
				positionReferenceBytes,
				lookBytes,
				referenceImages: manifest.referenceImages.map((image, index) => ({
					id: image.id,
					role: image.role,
					...(image.sameOwnerRecipient === undefined
						? {}
						: { sameOwnerRecipient: image.sameOwnerRecipient }),
					...(image.allowedProperties === undefined
						? {}
						: { allowedProperties: image.allowedProperties }),
					...(image.sourceHash === undefined
						? {}
						: { sourceHash: image.sourceHash }),
					bytes: referenceBytes[index],
				})),
				composition: manifest.composition,
			});
		} catch (error) {
			if (error instanceof z.ZodError) throw new CliError("INVALID_ARTIFACT");
			throw error;
		}
		if (args.command === "generate-reviewed") {
			const [rawTerminal, rawAuthority] = await Promise.all([
				readJson(args.previous),
				readJson(args.positionReference),
			]);
			const positionReference = z
				.strictObject({
					referenceVersion: z.string().min(1),
					referenceSHA: z.string().regex(/^[a-f0-9]{64}$/),
					ruleSHA: z.string().regex(/^[a-f0-9]{64}$/),
				})
				.parse(rawAuthority);
			const terminal = z
				.looseObject({
					id: z.string().min(1),
					requestId: z.string().min(1),
					status: z.unknown().optional(),
					result: z.looseObject({ path: z.string().optional() }).optional(),
					error: z.unknown().optional(),
				})
				.parse(rawTerminal);
			const resultPath = terminal.result?.path;
			const previous =
				resultPath === undefined
					? terminal
					: {
							...terminal,
							result: {
								...terminal.result,
								path: isAbsolute(resultPath)
									? resultPath
									: resolve(dirname(args.previous), resultPath),
							},
						};
			if (args.pins === undefined || args.profileSHA === undefined)
				throw new BatchHoldError(
					"OPERATOR_PINS_REQUIRED",
					"operator profile and source pins required",
				);
			const pins = operatorPinsSchema.parse(await readJson(args.pins));
			const prepared = preparePortraitConditions(candidate, pins);
			const projection = projectPortrait({
				candidate,
				operatorPins: pins,
				prepared,
			});
			const rawConnection = await readJson(args.connection);
			let connection: z.infer<typeof connectionSchema>;
			try {
				connection = connectionSchema.parse(rawConnection);
			} catch (error) {
				if (error instanceof z.ZodError)
					throw new CliError("INVALID_CONNECTION");
				throw error;
			}
			const apiKey =
				connection.apiKeyEnv === undefined
					? undefined
					: process.env[connection.apiKeyEnv];
			if (
				connection.apiKeyEnv !== undefined &&
				(apiKey === undefined || apiKey.length === 0)
			)
				throw new CliError("MISSING_API_KEY");
			await dispatchAfterBatchReview({
				previous,
				reviewPath: args.review,
				proportionRequirement: {
					profilePath: args.profile,
					...(args.profileSHA === undefined
						? {}
						: { profileFileSHA: args.profileSHA }),
					positionReference,
					measurementPath: args.measurement,
				},
				nextRequest: {
					projection,
					orderedImageBytes: candidate.referenceImages.map(
						(image) => image.bytes,
					),
					connection: {
						baseUrl: connection.baseUrl,
						...(apiKey === undefined ? {} : { apiKey }),
						...(connection.allowUnauthenticated === undefined
							? {}
							: { allowUnauthenticated: connection.allowUnauthenticated }),
					},
					requestId: args.requestId,
					outputPath: args.output,
				},
			});
			return;
		}
		const rawPins = await readJson(args.pins);
		let operatorPins: z.infer<typeof operatorPinsSchema>;
		try {
			operatorPins = operatorPinsSchema.parse(rawPins);
		} catch (error) {
			if (error instanceof z.ZodError)
				throw new PreflightError("OPERATOR_PIN_MISMATCH");
			throw error;
		}
		const prepared = preparePortraitConditions(candidate, operatorPins);
		const projection = projectPortrait({ candidate, operatorPins, prepared });
		if (args.command === "preflight") {
			process.stdout.write(
				`${JSON.stringify({ conditions: prepared, projection: { textSHA: projection.textSHA, renderingSHA: projection.renderingSHA, providerCalls: projection.providerCalls, dispatched: projection.dispatched } })}\n`,
			);
			return;
		}
		const rawConnection = await readJson(args.connection);
		let connection: z.infer<typeof connectionSchema>;
		try {
			connection = connectionSchema.parse(rawConnection);
		} catch (error) {
			if (error instanceof z.ZodError) throw new CliError("INVALID_CONNECTION");
			throw error;
		}
		const apiKey =
			connection.apiKeyEnv === undefined
				? undefined
				: process.env[connection.apiKeyEnv];
		if (
			connection.apiKeyEnv !== undefined &&
			(apiKey === undefined || apiKey.length === 0)
		)
			throw new CliError("MISSING_API_KEY");
		await sendPortraitRequest({
			projection,
			orderedImageBytes: candidate.referenceImages.map((image) => image.bytes),
			connection: {
				baseUrl: connection.baseUrl,
				...(apiKey === undefined ? {} : { apiKey }),
				...(connection.allowUnauthenticated === undefined
					? {}
					: { allowUnauthenticated: connection.allowUnauthenticated }),
			},
			requestId: args.requestId,
			outputPath: args.output,
		});
	} catch (error: unknown) {
		if (error instanceof CliError) {
			process.stderr.write(`${error.code}: ${error.code}\n`);
			process.exitCode = 1;
			return;
		}
		if (error instanceof BatchHoldError) {
			process.stderr.write(`${error.code}: ${error.code}\n`);
			process.exitCode = 1;
			return;
		}
		if (
			error instanceof PreflightError ||
			error instanceof ProjectionError ||
			error instanceof TransportError
		) {
			process.stderr.write(`${error.code}: ${error.code}\n`);
			process.exitCode = 1;
			return;
		}
		if (error instanceof z.ZodError) {
			process.stderr.write("INVALID_INPUT: INVALID_INPUT\n");
			process.exitCode = 1;
			return;
		}
		throw error;
	}
}
