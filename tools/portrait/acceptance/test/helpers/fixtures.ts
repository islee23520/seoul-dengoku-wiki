import { createHash } from "node:crypto";
import { encodePng } from "../../src/png.js";
import {
	createProportionProfile,
	type ProportionObservation,
} from "../../src/proportion.js";

export const digest = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

export function makePortrait(width = 1024, height = 1536): Uint8Array {
	const pixels = new Uint8Array(width * height * 4);
	for (let y = 350; y < 750; y++) {
		for (let x = 350; x < 675; x++) {
			const i = (y * width + x) * 4;
			pixels[i] = 80;
			pixels[i + 1] = 100;
			pixels[i + 2] = 120;
			pixels[i + 3] = 255;
		}
	}
	for (let y = 750; y < 770; y++) {
		for (let x = 350; x < 675; x++) {
			pixels[(y * width + x) * 4 + 3] = 128;
		}
	}
	return encodePng({ width, height, pixels });
}

export function makeObservation(
	imageSHA: string,
	measurementEvidenceSHA: string,
): ProportionObservation {
	return {
		imageSHA,
		measurementEvidenceSHA,
		actualImageMeasured: true,
		canvas: [1024, 1536],
		bodyType: "synthetic-fixture",
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
	};
}

export function makeProfile(
	imageBytes: Uint8Array,
	measurementBytes: Uint8Array,
) {
	const imageSHA = digest(imageBytes);
	const measurementSHA = digest(measurementBytes);
	return createProportionProfile({
		commonReference: makeObservation(imageSHA, measurementSHA),
		bodyReference: {
			...makeObservation(imageSHA, measurementSHA),
			bodyType: "synthetic-fixture",
		},
		bodyType: "synthetic-fixture",
		tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: measurementSHA },
	});
}
