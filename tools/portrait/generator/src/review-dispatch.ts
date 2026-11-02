import { requireBatchReview } from "portrait-acceptance";
import {
	type PortraitRequestInput,
	type PortraitRequestResult,
	sendPortraitRequest,
} from "./transport.js";

export type ReviewDispatchInput = Readonly<{
	previous: Parameters<typeof requireBatchReview>[0];
	reviewPath: Parameters<typeof requireBatchReview>[1];
	proportionRequirement: Parameters<typeof requireBatchReview>[2];
	nextRequest: PortraitRequestInput;
}>;

export type ReviewDispatchResult = Readonly<{
	verdict: Awaited<ReturnType<typeof requireBatchReview>> | null;
	transportResult: PortraitRequestResult | null;
	providerCalls: number;
}>;

export async function dispatchAfterBatchReview(
	input: ReviewDispatchInput,
): Promise<ReviewDispatchResult> {
	const verdict = await requireBatchReview(
		input.previous,
		input.reviewPath,
		input.proportionRequirement,
	);
	const transportResult = await sendPortraitRequest(input.nextRequest);
	return { verdict, transportResult, providerCalls: 1 };
}
