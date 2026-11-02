import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requireBatchReview } from "../src/batch-gate.js";
import {
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const digest = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const position = {
	referenceVersion: "fixture-v1",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const dirs: string[] = [];

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "batch-gate-"));
	dirs.push(root);
	await mkdir(join(root, "evidence"));
	const image = makePortrait();
	const measurement = new TextEncoder().encode(
		JSON.stringify({
			...makeObservation(digest(image), "0".repeat(64)),
			canvas: [1024, 1536],
		}),
	);
	const profile = makeProfile(image, measurement);
	const profilePath = join(root, "profile.json");
	const measurementPath = join(root, "measurement.json");
	const imagePath = join(root, "image.png");
	const evidence = new TextEncoder().encode("review evidence bytes");
	const evidencePath = join(root, "evidence", "review.txt");
	await Promise.all([
		writeFile(profilePath, JSON.stringify(profile)),
		writeFile(measurementPath, measurement),
		writeFile(imagePath, image),
		writeFile(evidencePath, evidence),
	]);
	const imageSHA = digest(image);
	const evidenceSHA = digest(evidence);
	const names = [
		...Array.from(
			{ length: 10 },
			(_, index) => `Q${String(index + 1).padStart(2, "0")}`,
		),
		"authoredIdentity",
		"approvedPositionIntervals",
		"opaqueInterior",
		"naturalSilhouette",
		"defringe",
	];
	const reviewPath = join(root, "review.json");
	const review = {
		characterId: "K001",
		requestId: "req-1",
		sha256: imageSHA,
		actualImageViewed: true,
		technicalVerdict: "pass",
		acceptanceSchema: "portrait-integrated-acceptance.v1",
		positionReference: position,
		criteria: Object.fromEntries(
			names.map((name) => [
				name,
				{ verdict: "pass", scope: "whole-image", imageSHA, evidenceSHA },
			]),
		),
		evidence: [{ sha256: evidenceSHA, path: "evidence/review.txt" }],
	};
	await writeFile(reviewPath, JSON.stringify(review));
	const terminal = {
		id: "K001",
		requestId: "req-1",
		result: { path: imagePath },
	};
	const pins = {
		profilePath,
		profileFileSHA: digest(new TextEncoder().encode(JSON.stringify(profile))),
		measurementPath,
		positionReference: position,
		profile,
	};
	return { root, reviewPath, review, terminal, pins, evidencePath };
}

afterEach(async () => {
	for (const path of dirs.splice(0)) await rm(path, { recursive: true });
});

describe("requireBatchReview", () => {
	it("holds unknown terminal before checking missing operator pins", async () => {
		await expect(
			requireBatchReview(
				{ status: "DISPATCHED_RESPONSE_UNKNOWN" },
				"/not-read",
				{},
			),
		).rejects.toMatchObject({
			name: "BatchHoldError",
			code: "TERMINAL_RECONCILIATION_REQUIRED",
			message: "batch held: failed or unknown response requires reconciliation",
		});
	});

	it("holds the intentionally pinless legacy requirement", async () => {
		const f = await fixture();
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, {
				profile: f.pins.profile,
				measurementPath: f.pins.measurementPath,
			}),
		).rejects.toMatchObject({
			code: "OPERATOR_PINS_REQUIRED",
			message:
				"batch held: operator-pinned profile and position authority required",
		});
	});

	it("advances a fully pinned review using byte-bound evidence", async () => {
		const f = await fixture();
		const result = await requireBatchReview(f.terminal, f.reviewPath, f.pins);
		expect(result.pass).toBe(true);
		expect(result.failures).toEqual([]);
	});

	it("holds a changed silhouette row naming its criterion", async () => {
		const f = await fixture();
		const silhouette = Reflect.get(f.review.criteria, "naturalSilhouette");
		const changed = {
			...f.review,
			criteria: {
				...f.review.criteria,
				naturalSilhouette: {
					...silhouette,
					verdict: "fail",
				},
			},
		};
		await writeFile(f.reviewPath, JSON.stringify(changed));
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, f.pins),
		).rejects.toMatchObject({
			code: "ACCEPTANCE_FAILED",
			message: expect.stringContaining("naturalSilhouette"),
		});
	});

	it("holds missing and tampered evidence artifacts", async () => {
		const f = await fixture();
		await writeFile(f.evidencePath, "changed evidence");
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, f.pins),
		).rejects.toMatchObject({ code: "EVIDENCE_HASH_MISMATCH" });
		await writeFile(
			f.reviewPath,
			JSON.stringify({ ...f.review, evidence: [] }),
		);
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, f.pins),
		).rejects.toMatchObject({ code: "EVIDENCE_REQUIRED" });
	});

	it("holds profile substitution and position-reference mismatch", async () => {
		const f = await fixture();
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, {
				...f.pins,
				profileFileSHA: "f".repeat(64),
			}),
		).rejects.toMatchObject({ code: "PROFILE_PIN_MISMATCH" });
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, {
				...f.pins,
				positionReference: { ...position, ruleSHA: "c".repeat(64) },
			}),
		).rejects.toMatchObject({
			code: "ACCEPTANCE_FAILED",
			message: expect.stringContaining("positionReference"),
		});
	});

	it("holds malformed pinned profiles as invalid artifacts", async () => {
		const f = await fixture();
		await writeFile(f.pins.profilePath, "{");
		const malformedSHA = digest(new TextEncoder().encode("{"));
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, {
				...f.pins,
				profileFileSHA: malformedSHA,
			}),
		).rejects.toMatchObject({ code: "INVALID_ARTIFACT" });
	});

	it("holds profile mismatch, missing evidence, malformed measurement, and traversal", async () => {
		const f = await fixture();
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, {
				...f.pins,
				profile: { ...f.pins.profile, bodyType: "other" },
			}),
		).rejects.toMatchObject({ code: "PROFILE_MISMATCH" });
		await writeFile(
			f.reviewPath,
			JSON.stringify({
				...f.review,
				evidence: [{ sha256: "0".repeat(64), path: "missing.txt" }],
			}),
		);
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, f.pins),
		).rejects.toMatchObject({ code: "INVALID_ARTIFACT" });
		await writeFile(f.reviewPath, JSON.stringify(f.review));
		await writeFile(f.pins.measurementPath, "{");
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, f.pins),
		).rejects.toMatchObject({ code: "ACCEPTANCE_FAILED" });
		await writeFile(
			f.reviewPath,
			JSON.stringify({
				...f.review,
				evidence: [{ sha256: "0".repeat(64), path: "../outside" }],
			}),
		);
		await expect(
			requireBatchReview(f.terminal, f.reviewPath, f.pins),
		).rejects.toMatchObject({ code: "INVALID_EVIDENCE_PATH" });
	});

	it("holds failed rows and preserves exact terminal identity binding", async () => {
		const f = await fixture();
		await expect(
			requireBatchReview(
				{ ...f.terminal, status: "FAILED" },
				f.reviewPath,
				f.pins,
			),
		).rejects.toMatchObject({ code: "TERMINAL_RECONCILIATION_REQUIRED" });
		await expect(
			requireBatchReview({ ...f.terminal, id: "K999" }, f.reviewPath, f.pins),
		).rejects.toMatchObject({ code: "INVALID_REVIEW" });
	});
});
