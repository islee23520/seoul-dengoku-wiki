import { createHash } from "node:crypto";
import { z } from "zod";

export const NATIVE_MOSS_PROVIDER = "native-moss" as const;
export const NATIVE_MOSS_MODEL =
	"native-moss:recovery16-provisional-v1" as const;
export const NATIVE_MOSS_PROTOCOL = "native-moss-ssh.v1" as const;
export const nativeMossRecipeSchema = z.enum([
	"recovery16-native-token-v1",
	"recovery16-native-flow-source045-v1",
	"recovery16-native-flow-source025-v1",
]);
export type NativeMossRecipe = z.infer<typeof nativeMossRecipeSchema>;
export const nativeMossRecipes = Object.freeze({
	"recovery16-native-token-v1": Object.freeze({
		inputMode: "token-only",
		fullSteps: 25,
		transitions: 25,
		denoise: null,
	}),
	"recovery16-native-flow-source045-v1": Object.freeze({
		inputMode: "reference-img2img",
		fullSteps: 55,
		transitions: 25,
		denoise: 0.45,
	}),
	"recovery16-native-flow-source025-v1": Object.freeze({
		inputMode: "reference-img2img",
		fullSteps: 100,
		transitions: 25,
		denoise: 0.25,
	}),
});
export const nativeMossConnectSchema = z.strictObject({
	provider: z.literal(NATIVE_MOSS_PROVIDER),
	model: z.literal(NATIVE_MOSS_MODEL),
});
export type NativeMossConnect = z.infer<typeof nativeMossConnectSchema>;
// Profile identity only, not a worker bundle hash or runtime readiness proof.
export const nativeMossProfile = Object.freeze({
	schema: "native-moss-profile.v1",
	provider: NATIVE_MOSS_PROVIDER,
	model: NATIVE_MOSS_MODEL,
	protocol: NATIVE_MOSS_PROTOCOL,
	adapterSHA256:
		"50dd8ab132a9d9c67e35e19bb7c1da6770658757df1c7b424d492999d200ca57",
	adapterBytes: 148697488,
	baseSHA256:
		"b4d1475bc7eeffd7b809e82ea13a1fba1fb85c4e18365af3813722faa5c0fe4f",
	encoderSHA256:
		"32e3787472f708fa5f83624acbf5ef23f7fc89c439e05065ea57cfe5a97f025a",
	vaeSHA256: "d8d52ba036475f5fb07c8b435e176d3d97ebfa82f0d1a1c317f9cc1e25bd013b",
	terminalReceiptSHA256:
		"09055e014559376af615cf8626b53a734d3ff55a757a13465a8304d4ff66bbd6",
	trainerCommit: "8cf43dd2cc1fe828884001aceeda044649d9abd0",
	generationProfile: "native340-v1",
	size: "340x510",
	width: 352,
	height: 512,
	crop: Object.freeze([6, 1, 346, 511]),
	seed: 152995270030802,
	steps: 25,
	cfg: 2.5,
	rank: 32,
	alpha: 32,
	multiplier: 1,
	savedTensorCount: 504,
	nativeTensorCount: 336,
	canMergeIn: false,
	networkPrecision: "float32",
	sampler: "euler",
	recipes: nativeMossRecipes,
	preserveOnly: true,
	ownerApproved: false,
	qualityQualified: false,
});
export type NativeMossProfile = typeof nativeMossProfile;
export const NATIVE_MOSS_PROFILE_DIGEST = createHash("sha256")
	.update(JSON.stringify(nativeMossProfile))
	.digest("hex");
export const nativeMossEndpoint = Object.freeze({
	endpointId: "native-moss-recovery16",
	revision: NATIVE_MOSS_PROFILE_DIGEST,
	protocolVersion: NATIVE_MOSS_PROTOCOL,
	toolName: "recovery16-native-generate.v1",
	toolSchemaDigest: NATIVE_MOSS_PROFILE_DIGEST,
});
