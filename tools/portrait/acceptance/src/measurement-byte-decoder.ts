import { ProportionError } from "./proportion-error.js";

export function decodeMeasurementValue(bytes: Uint8Array): unknown {
	try {
		return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	} catch (error: unknown) {
		if (error instanceof SyntaxError || error instanceof TypeError)
			throw new ProportionError(
				"INVALID_SOURCE_PROFILE",
				"invalid proportion measurement artifact",
			);
		throw error;
	}
}
