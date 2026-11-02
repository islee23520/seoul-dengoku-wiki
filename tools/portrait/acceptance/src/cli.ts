#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
	PortraitCliError,
	readArtifact,
	runFullAcceptanceCLI,
} from "./acceptance-ingress.js";

export {
	PortraitCliError,
	type PortraitCliErrorCode,
} from "./acceptance-ingress.js";

import {
	ObservableReviewError,
	observableReviewComparison,
} from "./observable-review.js";
import {
	SourceMeasurementError,
	sourceDraftComparison,
} from "./source-measurement.js";

const sourceUsage =
	"usage: portrait-acceptance source-compare <image.png> <measurement.json> --image-sha <sha256> --measurement-sha <sha256>";
const shaSchema = z.string().regex(/^[a-f0-9]{64}$/);
const observableUsage =
	"usage: portrait-acceptance observe-compare <image.png> <observation.json> --character <id> --image-sha <sha256> --observation-sha <sha256>";
function parseObservableArgs(args: string[]) {
	if (args.length === 1 && (args[0] === "--help" || args[0] === "-h"))
		return "help";
	const fail: () => never = () => {
		throw new PortraitCliError("USAGE", observableUsage);
	};
	const paths: string[] = [],
		flags = new Map<string, string>();
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === undefined) fail();
		if (!arg.startsWith("-")) {
			paths.push(arg);
			continue;
		}
		if (
			!["--character", "--image-sha", "--observation-sha"].includes(arg) ||
			flags.has(arg)
		)
			fail();
		const value = args[++index];
		if (
			!value ||
			value.startsWith("-") ||
			(arg === "--character"
				? !value.trim()
				: !shaSchema.safeParse(value).success)
		)
			fail();
		flags.set(arg, value);
	}
	const [imagePath, observationPath] = paths,
		expectedCharacterId = flags.get("--character"),
		expectedImageSHA = flags.get("--image-sha"),
		expectedObservationSHA = flags.get("--observation-sha");
	if (
		paths.length !== 2 ||
		!imagePath ||
		!observationPath ||
		!expectedCharacterId ||
		!expectedImageSHA ||
		!expectedObservationSHA
	)
		fail();
	return {
		imagePath,
		observationPath,
		expectedCharacterId,
		expectedImageSHA,
		expectedObservationSHA,
	};
}

function parseSourceArgs(args: string[]) {
	if (args.length === 1 && (args[0] === "--help" || args[0] === "-h"))
		return "help";
	const fail: () => never = () => {
		throw new PortraitCliError("USAGE", sourceUsage);
	};
	const paths: string[] = [];
	const flags = new Map<string, string>();
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === undefined) fail();
		if (!arg.startsWith("-")) {
			paths.push(arg);
			continue;
		}
		if (
			(arg !== "--image-sha" && arg !== "--measurement-sha") ||
			flags.has(arg)
		)
			fail();
		const value = args[++index];
		if (!value || !shaSchema.safeParse(value).success) fail();
		flags.set(arg, value);
	}
	const [imagePath, measurementPath] = paths;
	const expectedImageSHA = flags.get("--image-sha");
	const expectedMeasurementSHA = flags.get("--measurement-sha");
	if (
		paths.length !== 2 ||
		!imagePath ||
		!measurementPath ||
		!expectedImageSHA ||
		!expectedMeasurementSHA
	)
		fail();
	return {
		imagePath,
		measurementPath,
		expectedImageSHA,
		expectedMeasurementSHA,
	};
}

export async function runPortraitAcceptanceCLI(
	args: string[],
): Promise<number> {
	if (args[0] === "observe-compare") {
		try {
			const options = parseObservableArgs(args.slice(1));
			if (options === "help") {
				process.stdout.write(`${observableUsage}\n`);
				return 0;
			}
			const [imageBytes, observationBytes] = await Promise.all([
				readArtifact(options.imagePath),
				readArtifact(options.observationPath),
			]);
			const result = observableReviewComparison({
				imageBytes,
				observationBytes,
				expectedImageSHA: options.expectedImageSHA,
				expectedObservationSHA: options.expectedObservationSHA,
				expectedCharacterId: options.expectedCharacterId,
			});
			process.stdout.write(`${JSON.stringify(result)}\n`);
			return 0;
		} catch (error: unknown) {
			if (
				!(
					error instanceof ObservableReviewError ||
					error instanceof PortraitCliError
				)
			)
				throw error;
			process.stderr.write(
				`${JSON.stringify({ schema: "portrait-observable-review-error.v1", code: error.code, productionAdvancement: "HOLD" })}\n`,
			);
			return 1;
		}
	}

	try {
		if (args[0] === "source-compare") {
			const options = parseSourceArgs(args.slice(1));
			if (options === "help") {
				process.stdout.write(`${sourceUsage}\n`);
				return 0;
			}
			const [imageBytes, measurementBytes] = await Promise.all([
				readArtifact(options.imagePath),
				readArtifact(options.measurementPath),
			]);
			const comparison = sourceDraftComparison({
				imageBytes,
				measurementBytes,
				expectedImageSHA: options.expectedImageSHA,
				expectedMeasurementSHA: options.expectedMeasurementSHA,
			});
			process.stdout.write(`${JSON.stringify(comparison)}\n`);
			return 0;
		}
		return await runFullAcceptanceCLI(args);
	} catch (error: unknown) {
		if (
			!(
				error instanceof PortraitCliError ||
				error instanceof SourceMeasurementError
			)
		)
			throw error;
		process.stderr.write(`${error.message}\n`);
		return 1;
	}
}

if (
	import.meta.main ||
	(process.argv[1] &&
		realpathSync(process.argv[1]) ===
			realpathSync(fileURLToPath(import.meta.url)))
) {
	process.exitCode = await runPortraitAcceptanceCLI(process.argv.slice(2));
}
