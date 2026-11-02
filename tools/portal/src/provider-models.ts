import { z } from "zod";
import { NATIVE_MOSS_MODEL } from "./native-moss-contract.ts";

// Separate from historical HTTP/Comfy model schemas until native dispatch exists.
export const nativeMossProviderModelSchema = z.literal(NATIVE_MOSS_MODEL);
export type NativeMossProviderModel = z.infer<
	typeof nativeMossProviderModelSchema
>;

export const providerModels = [
	{ id: "gpt-image-2.5-sunburst", family: "gpt", label: "GPT 이미지" },
	{ id: "gemini-3.1-flash-image", family: "gemini", label: "Gemini 이미지" },
	{ id: "grok-imagine-image", family: "grok", label: "Grok 이미지" },
] as const;
export const defaultProviderModel = providerModels[0].id;
export const providerModelSchema = z.enum(
	providerModels.map((model) => model.id),
);
export type ProviderModel = z.infer<typeof providerModelSchema>;

// ComfyUI is a distinct provider with server-owned workflows, not an
// OpenAI-compatible model alias. The portal identifies a Comfy generation by
// `comfyui:<workflow>`; it never carries an API key or an OpenAI model name.
// Each workflow is its own registered connection endpoint (`endpointId`), so a
// Comfy connection is pinned to exactly one graph; the first entry keeps the
// original `comfyui` endpoint id.
const opaqueComfyWorkflows = [
	{
		id: "moss-image-sft-style-lora.v1",
		endpointId: "comfyui-moss-style",
		providerModel: "comfyui:moss-image-sft-style-lora.v1",
		label: "ComfyUI · MOSS-Image SFT 그림체 LoRA",
		limitations:
			"검증된 MOSS SFT 그림체 LoRA 한 개를 강도 1로 사용합니다. 실제 위키 디자인 토큰으로 컴파일한 초상화 프롬프트만 전송합니다. 기법 전용 자격과 소유자 시각 승인은 아직 미확정인 HOLD 후보입니다.",
	},
	{
		id: "moss-image-sft-style-captionfix.v1",
		endpointId: "comfyui-moss-captionfix",
		providerModel: "comfyui:moss-image-sft-style-captionfix.v1",
		label: "후보 · MOSS 캡션 교정 LoRA · 강도 1",
		limitations:
			"동일 승인 이미지의 캡션만 교정하여 재학습한 후보입니다. 기본 그림체를 교체하지 않습니다. 시선 교정·그림체 보존·기법 전용 자격·소유자 승인은 아직 미확정이며 실제 위키 토큰으로 비교하는 HOLD 후보입니다.",
	},
	{
		id: "moss-image-sft-style-male.v1",
		endpointId: "comfyui-moss-male",
		providerModel: "comfyui:moss-image-sft-style-male.v1",
		label: "후보 · MOSS 남성 59인 LoRA · 강도 1",
		limitations:
			"남성 59인 동일 가중치 학습 후보입니다. 평가 전용 6인은 학습에서 제외했습니다. 기본 그림체·시선 제어·소유자 승인을 대체하지 않는 HOLD 비교 후보입니다.",
	},
	{
		id: "moss-image-sft-style-diagnostic-zero.v1",
		endpointId: "comfyui-moss-style-zero",
		providerModel: "comfyui:moss-image-sft-style-diagnostic-zero.v1",
		label: "진단 전용 · MOSS 강도 0 · 트리거 유지",
		limitations:
			"시선 원인 비교 전용: 그림체 트리거와 v3 프롬프트를 유지하고 LoRA 강도만 0으로 고정합니다. 그림체 후보나 제작 승인 결과가 아닙니다. 동일 인물·시드로 비교하는 HOLD 진단입니다.",
	},
	{
		id: "moss-image-sft-style-diagnostic-reduced.v1",
		endpointId: "comfyui-moss-style-reduced",
		providerModel: "comfyui:moss-image-sft-style-diagnostic-reduced.v1",
		label: "진단 전용 · MOSS 강도 0.7 · 트리거 유지",
		limitations:
			"강도 0 실제 결과의 오른쪽 시선을 확인한 뒤에만 비교합니다. 동일 트리거·v3 프롬프트에서 LoRA 강도만 0.7로 고정한 HOLD 실험이며 기본 그림체 교체나 소유자 승인이 아닙니다.",
	},
	{
		id: "zimage-turbo-text-draft.v1",
		endpointId: "comfyui",
		providerModel: "comfyui:zimage-turbo-text-draft.v1",
		label: "ComfyUI · ZImage Turbo 텍스트→이미지 초안",
		limitations:
			"작성된 디자인 토큰 투영에서 서버가 컴파일한 초상화 프롬프트(1인 상반신, 무지 배경, 글자 없음)만 전송합니다. 사진·기법·구도 참조 이미지는 전달되지 않으며 참조 충실도나 SD3.5 스타일 자격을 주장하지 않습니다. 초안 HOLD 후보입니다.",
	},
	{
		id: "moss-image-sft-text.v1",
		endpointId: "comfyui-moss",
		providerModel: "comfyui:moss-image-sft-text.v1",
		label: "ComfyUI · MOSS-Image SFT 텍스트→이미지",
		limitations:
			"ComfyUI 0.42.0 공식 MOSS-Image SFT 텍스트→이미지 템플릿의 원문 프롬프트 경로(25단계, CFG 2.5, er_sde)를 서버가 그대로 사용합니다. 같은 컴파일된 초상화 프롬프트만 전송하며 참조·스타일 이미지, LoRA, 프롬프트 보강은 없습니다. 참조 충실도나 스타일 자격을 주장하지 않는 초안 HOLD 후보입니다.",
	},
] as const;
// Historical identities remain readable in jobs and receipts, but only MOSS
// is offered for new connections and generation requests.
const alphaTextWorkflows = opaqueComfyWorkflows
	.filter((workflow) => workflow.id !== "zimage-turbo-text-draft.v1")
	.map((workflow) => ({
		...workflow,
		id: workflow.id.replace(
			".v1",
			".alpha.v1",
		) as `${Exclude<typeof workflow.id, "zimage-turbo-text-draft.v1"> extends `${infer Name}.v1` ? Name : never}.alpha.v1`,
		endpointId: `${workflow.endpointId}-alpha`,
		providerModel:
			`comfyui:${workflow.id.replace(".v1", ".alpha.v1")}` as `comfyui:${string}.alpha.v1`,
		label: `${workflow.label} · 자동 투명 마무리`,
		limitations: `${workflow.limitations} 생성 후 BiRefNet 분할로 투명 배경을 자동 마무리합니다. 원본·마스크를 보존하며 실패 시 불투명 결과를 대신 전달하지 않습니다. 가는 머리카락의 밝은 테두리는 남을 수 있으며 스타일·소유자 승인과 별개입니다.`,
	}));
export const COMFY_SOURCE_WORKFLOW =
	"moss-image-sft-source-img2img.alpha.v1" as const;
export const comfyWorkflows = [
	...alphaTextWorkflows,
	{
		id: COMFY_SOURCE_WORKFLOW,
		endpointId: "comfyui-moss-source-img2img-alpha",
		providerModel: `comfyui:${COMFY_SOURCE_WORKFLOW}` as const,
		label: "ComfyUI · MOSS source img2img · explicit alternative",
		limitations:
			"Source-native latent initialization only. GPU compatibility, preservation quality and owner approval remain HOLD. No automatic fallback.",
	},
];
const storedComfyWorkflows = [...opaqueComfyWorkflows, ...comfyWorkflows];
export function opaqueWorkflow(workflow: string) {
	return workflow.replace(".alpha.v1", ".v1");
}
export function isAlphaWorkflow(workflow: string) {
	return comfyWorkflows.some((entry) => entry.id === workflow);
}
export const comfyWorkflowSchema = z.enum(
	storedComfyWorkflows.map((workflow) => workflow.id),
);
export type AnyComfyWorkflow = z.infer<typeof comfyWorkflowSchema>;
// Legacy token compilers intentionally do not accept the source workflow.
export type ComfyWorkflow = Exclude<
	AnyComfyWorkflow,
	typeof COMFY_SOURCE_WORKFLOW
>;
// Closed server-owned recipes, never a browser numeric strength control.
export function mossStyleStrength(workflow: string) {
	workflow = opaqueWorkflow(workflow);
	if (workflow === "moss-image-sft-style-male.v1") return 1;
	if (workflow === "moss-image-sft-style-captionfix.v1") return 1;
	if (workflow === "moss-image-sft-style-lora.v1") return 1;
	if (workflow === "moss-image-sft-style-diagnostic-zero.v1") return 0;
	if (workflow === "moss-image-sft-style-diagnostic-reduced.v1") return 0.7;
	return undefined;
}
export const comfyProviderModelSchema = z.enum(
	storedComfyWorkflows.map((workflow) => workflow.providerModel),
);
export type ComfyProviderModel = z.infer<typeof comfyProviderModelSchema>;
export const generationProviderModelSchema = z.enum([
	defaultProviderModel,
	...storedComfyWorkflows.map((workflow) => workflow.providerModel),
]);
export type GenerationProviderModel = z.infer<
	typeof generationProviderModelSchema
>;
export function comfyWorkflowOf(providerModel: string) {
	return (
		storedComfyWorkflows.find(
			(workflow) => workflow.providerModel === providerModel,
		) ?? null
	);
}
