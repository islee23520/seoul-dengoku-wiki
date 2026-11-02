import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
	createProportionProfile,
	type LandmarkSet,
	measureProportions,
	PROPORTION_PROFILE_SCHEMA,
	PROPORTION_SEMANTICS,
	PROPORTION_VERDICT_SCHEMA,
	ProportionError,
	type ProportionObservation,
	type ProportionProfile,
	type ProportionTolerance,
	proportionInstruction,
	validateProportionProfile,
	validateSharedProportionProfiles,
	verifyProportions,
} from "../src/proportion.js";

const sha = (text: string): string =>
	createHash("sha256").update(text).digest("hex");

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

// Independent oracle: canonical JSON re-derived from the native contract, used
// to pin profileSHA byte-for-byte without calling into src/proportion.ts.
const canonicalJSON = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
	if (isRecord(value))
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`)
			.join(",")}}`;
	return JSON.stringify(value);
};

const hashOf = (value: unknown): string =>
	createHash("sha256").update(canonicalJSON(value)).digest("hex");

const makeCommon = (): ProportionObservation => ({
	imageSHA: sha("common-image"),
	measurementEvidenceSHA: sha("common-measurement"),
	actualImageMeasured: true,
	canvas: [1024, 1536],
	landmarks: {
		crown: [512, 100],
		chin: [512, 500],
		headLeft: [412, 300],
		headRight: [612, 300],
		faceTop: [512, 160],
		faceLeft: [452, 300],
		faceRight: [572, 300],
		leftPupil: [472, 260],
		rightPupil: [552, 260],
		leftShoulder: [362, 560],
		rightShoulder: [662, 560],
		torsoLeft: [412, 620],
		torsoRight: [612, 620],
	},
});

const makeBody = (bodyType = "slim"): ProportionObservation => ({
	...makeCommon(),
	imageSHA: sha("body-image"),
	measurementEvidenceSHA: sha("body-measurement"),
	bodyType,
});

const makeTolerance = (
	overrides?: Partial<Pick<ProportionTolerance, "pixels" | "ratio">>,
): ProportionTolerance => ({
	pixels: 2,
	ratio: 0.05,
	evidenceSHA: sha("tolerance-evidence"),
	...overrides,
});

const makeProfile = (
	bodyType = "slim",
	toleranceOverrides?: Partial<Pick<ProportionTolerance, "pixels" | "ratio">>,
	commonOverrides?: Partial<ProportionObservation>,
): ProportionProfile =>
	createProportionProfile({
		commonReference: { ...makeCommon(), ...commonOverrides },
		bodyReference: makeBody(bodyType),
		bodyType,
		tolerance: makeTolerance(toleranceOverrides),
	});

const withLandmarks = (
	observation: ProportionObservation,
	patch: Partial<LandmarkSet>,
): ProportionObservation => ({
	...observation,
	landmarks: { ...observation.landmarks, ...patch },
});

const rehash = (
	profile: ProportionProfile,
	overrides: Record<string, unknown>,
): unknown => {
	const { profileSHA: _dropped, ...payload } = profile;
	const tampered = { ...payload, ...overrides };
	return { ...tampered, profileSHA: hashOf(tampered) };
};

const MEASURED = {
	headWidth: 200,
	headHeight: 400,
	faceWidth: 120,
	faceHeight: 340,
	eyeY: 260,
	headCenterX: 512,
	crownY: 100,
	shoulderWidth: 300,
	torsoWidth: 200,
};

const expectProportionError = (run: () => unknown, code: string): void => {
	try {
		run();
		expect.unreachable("expected ProportionError");
	} catch (error) {
		expect(error).toBeInstanceOf(ProportionError);
		expect(error).toMatchObject({ code });
	}
};

describe("measureProportions", () => {
	it("measures exact landmark metrics", () => {
		expect(measureProportions(makeCommon())).toEqual(MEASURED);
	});

	it("requires a source-bound actual landmark measurement", () => {
		expectProportionError(
			() => measureProportions(null),
			"SOURCE_BINDING_REQUIRED",
		);
		expect(() => measureProportions(null)).toThrow(
			"source-bound actual landmark measurement required",
		);
		expect(() => measureProportions({})).toThrow(
			"source-bound actual landmark measurement required",
		);
		expect(() =>
			measureProportions({ ...makeCommon(), actualImageMeasured: false }),
		).toThrow("source-bound actual landmark measurement required");
		expect(() =>
			measureProportions({ ...makeCommon(), imageSHA: "not-a-sha" }),
		).toThrow("source-bound actual landmark measurement required");
	});

	it("requires the 1024x1536 canvas", () => {
		expect(() =>
			measureProportions({ ...makeCommon(), canvas: [1000, 1500] }),
		).toThrow("proportion canvas must be 1024x1536");
	});

	it("requires complete in-canvas semantic landmarks", () => {
		expectProportionError(
			() =>
				measureProportions(withLandmarks(makeCommon(), { crown: [512, -1] })),
			"INVALID_LANDMARKS",
		);
		expect(() =>
			measureProportions({
				...makeCommon(),
				landmarks: { ...makeCommon().landmarks, crown: undefined },
			}),
		).toThrow("complete in-canvas semantic landmarks required");
		expect(() =>
			measureProportions(withLandmarks(makeCommon(), { crown: [512, -1] })),
		).toThrow("complete in-canvas semantic landmarks required");
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), { headRight: [1024, 300] }),
			),
		).toThrow("complete in-canvas semantic landmarks required");
		expect(() =>
			measureProportions({
				...makeCommon(),
				landmarks: { ...makeCommon().landmarks, chin: [512] },
			}),
		).toThrow("complete in-canvas semantic landmarks required");
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), { faceLeft: [Number.NaN, 300] }),
			),
		).toThrow("complete in-canvas semantic landmarks required");
	});

	it("requires torso landmarks on one shared level", () => {
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), { torsoRight: [612, 621] }),
			),
		).toThrow("torso cross-section landmarks must share the same level");
	});

	it("requires face landmarks inside the measured head", () => {
		expect(() =>
			measureProportions(withLandmarks(makeCommon(), { faceLeft: [410, 300] })),
		).toThrow("face landmarks must lie inside the measured head");
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), { faceRight: [614, 300] }),
			),
		).toThrow("face landmarks must lie inside the measured head");
		expect(() =>
			measureProportions(withLandmarks(makeCommon(), { faceTop: [512, 90] })),
		).toThrow("face landmarks must lie inside the measured head");
		expect(() =>
			measureProportions(withLandmarks(makeCommon(), { faceTop: [512, 500] })),
		).toThrow("face landmarks must lie inside the measured head");
	});

	it("requires pupil landmarks inside the measured face", () => {
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), { leftPupil: [450, 260] }),
			),
		).toThrow("pupil landmarks must lie inside the measured face");
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), { rightPupil: [552, 505] }),
			),
		).toThrow("pupil landmarks must lie inside the measured face");
	});

	it("requires positive landmark spans", () => {
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), {
					faceLeft: [472, 300],
					faceRight: [472, 300],
					leftPupil: [472, 260],
					rightPupil: [472, 260],
				}),
			),
		).toThrow("landmark spans must be positive");
		expect(() =>
			measureProportions(
				withLandmarks(makeCommon(), {
					leftShoulder: [362, 560],
					rightShoulder: [362, 560],
				}),
			),
		).toThrow("landmark spans must be positive");
	});
});

describe("createProportionProfile", () => {
	it("builds the exact source-bound profile contract", () => {
		const profile = makeProfile();
		const expectedPayload: Omit<ProportionProfile, "profileSHA"> = {
			schema: PROPORTION_PROFILE_SCHEMA,
			canvas: [1024, 1536],
			bodyType: "slim",
			commonSourceSHA: sha("common-image"),
			commonMeasurementSHA: sha("common-measurement"),
			bodySourceSHA: sha("body-image"),
			bodyMeasurementSHA: sha("body-measurement"),
			targets: {
				headWidth: 200,
				headHeight: 400,
				faceWidth: 120,
				faceHeight: 340,
				eyeY: 260,
				headCenterX: 512,
				crownY: 100,
			},
			ratios: { shoulderToHead: 1.5, torsoToHead: 1 },
			tolerance: makeTolerance(),
			semantics: PROPORTION_SEMANTICS,
		};
		expect(profile).toEqual({
			...expectedPayload,
			profileSHA: hashOf(expectedPayload),
		});
	});

	it("pins the native profile hash byte for byte", () => {
		// Value computed from native/lib/proportion-profile.mjs on 2026-10-11
		// for this fixture; any canonicalization drift breaks it.
		expect(makeProfile().profileSHA).toBe(
			"bbb898dd01570160fcdc9cc93bfd3e704a95910cea8cb2ec86dce092a568beb4",
		);
	});

	it("hashes deterministically as lowercase sha256 hex", () => {
		const first = makeProfile();
		const second = makeProfile();
		expect(second.profileSHA).toBe(first.profileSHA);
		expect(first.profileSHA).toMatch(/^[a-f0-9]{64}$/);
	});

	it("requires an authored body type identifier", () => {
		expect(() => makeProfile("")).toThrow(
			"authored body type identifier required",
		);
		expect(() => makeProfile("   ")).toThrow(
			"authored body type identifier required",
		);
	});

	it("requires explicit source-bound tolerances", () => {
		expect(() => makeProfile("slim", { pixels: -1 })).toThrow(
			"source-bound explicit proportion tolerances required",
		);
		expect(() => makeProfile("slim", { ratio: Number.NaN })).toThrow(
			"source-bound explicit proportion tolerances required",
		);
		expect(() =>
			createProportionProfile({
				commonReference: makeCommon(),
				bodyReference: makeBody(),
				bodyType: "slim",
				tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: "not-a-sha" },
			}),
		).toThrow("source-bound explicit proportion tolerances required");
	});

	it("measures both references before authoring checks", () => {
		expect(() =>
			createProportionProfile({
				commonReference: { ...makeCommon(), imageSHA: "nope" },
				bodyReference: makeBody(),
				bodyType: "",
				tolerance: makeTolerance(),
			}),
		).toThrow("source-bound actual landmark measurement required");
	});
});

describe("validateProportionProfile", () => {
	it("accepts and returns the created profile", () => {
		const profile = makeProfile();
		expect(validateProportionProfile(profile)).toEqual(profile);
	});

	it("rejects values that are not proportion profiles", () => {
		expect(() => validateProportionProfile(null)).toThrow(
			"proportion profile required",
		);
		expect(() => validateProportionProfile(42)).toThrow(
			"proportion profile required",
		);
		expect(() => validateProportionProfile("profile")).toThrow(
			"proportion profile required",
		);
		expect(() => validateProportionProfile({})).toThrow(
			"proportion profile required",
		);
		expect(() =>
			validateProportionProfile({
				...makeProfile(),
				schema: "portrait-proportion-profile.v2",
			}),
		).toThrow("proportion profile required");
	});

	it("rejects a tampered payload as a hash mismatch", () => {
		expectProportionError(
			() =>
				validateProportionProfile({ ...makeProfile(), bodyType: "athletic" }),
			"PROFILE_HASH_MISMATCH",
		);
		expect(() =>
			validateProportionProfile({ ...makeProfile(), bodyType: "athletic" }),
		).toThrow("proportion profile hash mismatch");
		expect(() =>
			validateProportionProfile({ ...makeProfile(), profileSHA: "nope" }),
		).toThrow("proportion profile hash mismatch");
	});

	it("rejects invalid source binding on a rehashed profile", () => {
		expect(() =>
			validateProportionProfile(rehash(makeProfile(), { canvas: [999, 999] })),
		).toThrow("invalid source-bound proportion profile");
		expect(() =>
			validateProportionProfile(rehash(makeProfile(), { bodyType: "  " })),
		).toThrow("invalid source-bound proportion profile");
		expect(() =>
			validateProportionProfile(
				rehash(makeProfile(), { tolerance: { pixels: 2, ratio: 0.05 } }),
			),
		).toThrow("invalid source-bound proportion profile");
	});

	it("rejects invalid proportion targets on a rehashed profile", () => {
		expect(() =>
			validateProportionProfile(
				rehash(makeProfile(), {
					targets: { ...makeProfile().targets, headWidth: "200" },
				}),
			),
		).toThrow("invalid proportion targets");
		expect(() =>
			validateProportionProfile(rehash(makeProfile(), { ratios: null })),
		).toThrow("invalid proportion targets");
		expect(() =>
			validateProportionProfile(
				rehash(makeProfile(), {
					ratios: { shoulderToHead: 1.5, torsoToHead: 1, extra: 9 },
				}),
			),
		).toThrow("invalid proportion targets");
		expect(() =>
			validateProportionProfile(
				rehash(makeProfile(), {
					ratios: { shoulderToHead: 0, torsoToHead: 1 },
				}),
			),
		).toThrow("invalid proportion targets");
	});

	it("rejects invalid tolerances on a rehashed profile", () => {
		expectProportionError(
			() =>
				validateProportionProfile(
					rehash(makeProfile(), {
						tolerance: { ...makeTolerance(), pixels: -1 },
					}),
				),
			"INVALID_PROFILE_TOLERANCES",
		);
		expect(() =>
			validateProportionProfile(
				rehash(makeProfile(), {
					tolerance: { ...makeTolerance(), pixels: -1 },
				}),
			),
		).toThrow("invalid proportion tolerances");
		expect(() =>
			validateProportionProfile(
				rehash(makeProfile(), {
					tolerance: { ...makeTolerance(), ratio: Number.POSITIVE_INFINITY },
				}),
			),
		).toThrow("invalid proportion tolerances");
	});
});

describe("verifyProportions", () => {
	it("passes an identical body and reports the exact verdict", () => {
		const profile = makeProfile();
		expect(verifyProportions(profile, makeBody())).toEqual({
			schema: PROPORTION_VERDICT_SCHEMA,
			imageSHA: sha("body-image"),
			measurementEvidenceSHA: sha("body-measurement"),
			profileSHA: profile.profileSHA,
			bodyType: "slim",
			measured: MEASURED,
			ratios: { shoulderToHead: 1.5, torsoToHead: 1 },
			failures: [],
			pass: true,
			ownerApprovalImplied: false,
		});
	});

	it("passes when metric drift equals the pixel tolerance exactly", () => {
		const profile = makeProfile();
		const boundary = withLandmarks(makeBody(), {
			faceLeft: [451, 300],
			faceRight: [573, 300],
		});
		expect(verifyProportions(profile, boundary).pass).toBe(true);
	});

	it("reports metrics drifting beyond the pixel tolerance", () => {
		const profile = makeProfile();
		const verdict = verifyProportions(
			profile,
			withLandmarks(makeBody(), {
				faceLeft: [451, 300],
				faceRight: [574, 300],
			}),
		);
		expect(verdict.failures).toEqual(["faceWidth"]);
		expect(verdict.pass).toBe(false);
	});

	it("reports ratio drift beyond the ratio tolerance", () => {
		const profile = makeProfile();
		const verdict = verifyProportions(
			profile,
			withLandmarks(makeBody(), {
				leftShoulder: [352, 560],
				rightShoulder: [672, 560],
			}),
		);
		expect(verdict.failures).toEqual(["shoulderToHead"]);
	});

	it("reports body type mismatch first in the failure order", () => {
		const profile = makeProfile();
		const drifted = withLandmarks(makeBody("athletic"), {
			faceLeft: [451, 300],
			faceRight: [574, 300],
			leftShoulder: [352, 560],
			rightShoulder: [672, 560],
		});
		expect(verifyProportions(profile, drifted).failures).toEqual([
			"bodyType",
			"faceWidth",
			"shoulderToHead",
		]);
	});

	it("keeps owner approval unimplied", () => {
		expect(
			verifyProportions(makeProfile(), makeBody()).ownerApprovalImplied,
		).toBe(false);
	});

	it("validates profile and observation through the same boundaries", () => {
		expect(() => verifyProportions("junk", makeBody())).toThrow(
			"proportion profile required",
		);
		expect(() => verifyProportions(makeProfile(), null)).toThrow(
			"source-bound actual landmark measurement required",
		);
	});
});

describe("validateSharedProportionProfiles", () => {
	it("accepts a batch sharing one head standard", () => {
		const shared = validateSharedProportionProfiles([
			makeProfile("slim"),
			makeProfile("athletic"),
		]);
		expect(shared.commonSHA).toMatch(/^[a-f0-9]{64}$/);
		expect(shared.bodyTypes).toEqual(["slim", "athletic"]);
	});

	it("rejects a batch mixing head and face standards", () => {
		const otherCommon = makeProfile("slim", undefined, {
			imageSHA: sha("other-common-image"),
		});
		expect(() =>
			validateSharedProportionProfiles([makeProfile("slim"), otherCommon]),
		).toThrow("batch profiles must share one head and face standard");
	});

	it("rejects conflicting proportional standards per body type", () => {
		expect(() =>
			validateSharedProportionProfiles([
				makeProfile("slim"),
				makeProfile("slim", { ratio: 0.06 }),
			]),
		).toThrow("same body type must use one proportional standard");
	});

	it("requires a nonempty profile batch", () => {
		expectProportionError(
			() => validateSharedProportionProfiles([]),
			"BATCH_PROFILES_REQUIRED",
		);
		expect(() => validateSharedProportionProfiles([])).toThrow(
			"batch proportion profiles required",
		);
		expect(() => validateSharedProportionProfiles(null)).toThrow(
			"batch proportion profiles required",
		);
		expect(() => validateSharedProportionProfiles("profiles")).toThrow(
			"batch proportion profiles required",
		);
		expect(() => validateSharedProportionProfiles([null])).toThrow(
			"proportion profile required",
		);
	});
});

describe("proportionInstruction", () => {
	it("renders the exact machine-consumed instruction contract", () => {
		expect(proportionInstruction(makeProfile())).toBe(
			'Use the fixed 1024x1536 canvas. Common head/face measurements in source pixels: {"crownY":100,"eyeY":260,"faceHeight":340,"faceWidth":120,"headCenterX":512,"headHeight":400,"headWidth":200}. Body type slim: shoulder joint span / head width = 1.5; visible torso cross-section span / head width = 1. Pixel tolerance 2; ratio tolerance 0.05. Preserve authored identity and body type. Never stretch width and height independently or use garment edges as shoulder joints. These measurements require actual output verification, not provider success.',
		);
	});

	it("rejects an invalid profile", () => {
		expect(() => proportionInstruction(null)).toThrow(
			"proportion profile required",
		);
	});
});

describe("native mjs parity", () => {
	it("reproduces the native profile hash, verdict and instruction", async () => {
		const nativePath = join(
			import.meta.dir,
			"../../native/lib/proportion-profile.mjs",
		);
		const fixture = JSON.stringify({
			commonReference: makeCommon(),
			bodyReference: makeBody(),
			bodyType: "slim",
			tolerance: makeTolerance(),
		});
		const script = `import(${JSON.stringify(nativePath)}).then((m) => { const profile = m.createProportionProfile(${fixture}); const verdict = m.verifyProportions(profile, ${fixture}.bodyReference); const instruction = m.proportionInstruction(profile); console.log(JSON.stringify({ profileSHA: profile.profileSHA, verdict, instruction })); });`;
		const child = Bun.spawn(["bun", "-e", script], {
			stdout: "pipe",
			stderr: "pipe",
			cwd: import.meta.dir,
		});
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);
		expect(stderr).toBe("");
		expect(exitCode).toBe(0);
		const native: {
			profileSHA: string;
			verdict: Record<string, unknown>;
			instruction: string;
		} = JSON.parse(stdout);
		const profile = makeProfile();
		expect(profile.profileSHA).toBe(native.profileSHA);
		expect(native.verdict).toEqual(verifyProportions(profile, makeBody()));
		expect(proportionInstruction(profile)).toBe(native.instruction);
	});
});
