/**
 * Single standards source for portrait acceptance (audit B6): modules consume
 * these constants; the literals are never duplicated.
 *
 * Values are the existing standards, unchanged. Hashes establish integrity
 * only: no owner or release approval is implied, and hashes never verify
 * semantic placement.
 */
export const PORTRAIT_ACCEPTANCE_CRITERIA = {
	schema: "portrait-integrated-acceptance.v1",
	canvas: [1024, 1536],
	qualityRows: [
		"Q01",
		"Q02",
		"Q03",
		"Q04",
		"Q05",
		"Q06",
		"Q07",
		"Q08",
		"Q09",
		"Q10",
	],
	semanticRows: [
		"authoredIdentity",
		"approvedPositionIntervals",
		"opaqueInterior",
		"naturalSilhouette",
		"defringe",
	],
	coreAlphaMinimum: 250,
	minimumCoreFraction: 0.9,
	positionReferenceSchema: "position-reference.v2",
	positionReferenceFields: ["referenceVersion", "referenceSHA", "ruleSHA"],
} as const;

export type PortraitAcceptanceCriteria = typeof PORTRAIT_ACCEPTANCE_CRITERIA;

// Delivery diagnostics are not the legacy native-canvas integrated evaluator.
export const PORTRAIT_DELIVERY_CRITERIA_V2 = {
	schema: "portrait-delivery-alpha.v2",
	canvas: [340, 510],
	nativeCanvas: [1024, 1536],
	backgroundAlpha: 0,
	interiorAlpha: 255,
	semanticRows: ["opaqueInterior", "naturalSilhouette", "defringe"],
	partialAlpha: "actual silhouette edges only; requires image review",
	sourcePadding: "computational contain padding, not authored artwork",
} as const;
