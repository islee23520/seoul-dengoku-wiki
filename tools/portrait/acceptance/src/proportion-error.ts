export type ProportionErrorCode =
	| "SOURCE_BINDING_REQUIRED"
	| "INVALID_CANVAS"
	| "INVALID_LANDMARKS"
	| "TORSO_LEVEL_MISMATCH"
	| "FACE_OUTSIDE_HEAD"
	| "PUPILS_OUTSIDE_FACE"
	| "NONPOSITIVE_LANDMARK_SPANS"
	| "BODY_TYPE_REQUIRED"
	| "INVALID_TOLERANCES"
	| "PROFILE_REQUIRED"
	| "PROFILE_HASH_MISMATCH"
	| "INVALID_SOURCE_PROFILE"
	| "INVALID_TARGETS"
	| "INVALID_PROFILE_TOLERANCES"
	| "BATCH_PROFILES_REQUIRED"
	| "BATCH_COMMON_STANDARD_MISMATCH"
	| "BATCH_BODY_STANDARD_MISMATCH";

export class ProportionError extends Error {
	readonly code: ProportionErrorCode;

	constructor(code: ProportionErrorCode, message: string) {
		super(message);
		this.name = "ProportionError";
		this.code = code;
	}
}
