import { z } from "zod";

// Minimum documented area, closest 2:3 aspect among area ties. Not runtime proof.
export const cpaPaddingSchema = z.strictObject({
	requested: z.tuple([z.literal(340), z.literal(510)]),
	canvas: z.tuple([z.literal(640), z.literal(1024)]),
	contentRect: z.strictObject({
		x: z.literal(150),
		y: z.literal(257),
		width: z.literal(340),
		height: z.literal(510),
	}),
	scale: z.literal(1),
	resampling: z.literal("NONE"),
	padding: z.literal("transparent-computational-only"),
	delivery: z.tuple([z.literal(340), z.literal(510)]),
});
export const cpaPadding = cpaPaddingSchema.parse({
	requested: [340, 510],
	canvas: [640, 1024],
	contentRect: { x: 150, y: 257, width: 340, height: 510 },
	scale: 1,
	resampling: "NONE",
	padding: "transparent-computational-only",
	delivery: [340, 510],
});

export function validateCpaCanvas(width: number, height: number) {
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0 ||
		width % 16 !== 0 ||
		height % 16 !== 0 ||
		width > 3840 ||
		height > 3840 ||
		width * height < 655360 ||
		width * height > 8294400 ||
		width / height < 1 / 3 ||
		width / height > 3
	)
		throw Error("GENERATION_SIZE_UNSUPPORTED");
}
