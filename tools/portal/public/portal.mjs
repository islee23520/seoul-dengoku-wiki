const $ = (id) => document.getElementById(id);
const apiBase = "/tools/api";
const model = "gpt-image-2.5-sunburst";
let session = null;
let loginMode = null;
let characters = [];
let selected = null;
let activeJob = null;
let jobHistory = [];
let historyVersion = 0;
let jobEvents = null;
// Resolvers waiting for the next server job event (SSE) while a job whose
// response was lost is followed to its terminal state.
const jobSignalWaiters = [];
let deferredHistoryResult = null;
let pending = false;
let uploadPending = false;
let epoch = 0;
let selectionVersion = 0;
let previewVersion = 0;
let previewUrl = null;
const controllers = new Set();
let wikiSearchVersion = 0;
let wikiSearchController = null;
let wikiDetailController = null;
let wikiNextCursor = null;
let wikiQuery = "";
let wikiLoading = false;
const wikiPeople = new Map();
let connection = null;
let connectionPending = false;
// ComfyUI is a distinct provider connection that coexists with the
// OpenAI-compatible one; selecting it never sends a request by itself.
let connectionProvider = null;
let comfyAvailable = false;
let comfyCanvasUrl = null;
let comfyWorkflows = [];
let comfyConnection = null;
let comfyReadiness = null;
let comfyPending = false;
const nativeModel = "native-moss:recovery16-provisional-v1";
const nativeAdapter =
	"50dd8ab132a9d9c67e35e19bb7c1da6770658757df1c7b424d492999d200ca57";
const nativeProfileDigest =
	"1b340aab2d91ca70ed0a6d01cfaa84df1f8194d71e9c0900c6874e1fd844c8c6";
const nativeRecipes = [
	"recovery16-native-token-v1",
	"recovery16-native-flow-source045-v1",
	"recovery16-native-flow-source025-v1",
];
let nativeCapability = null;
let nativeCapabilityReason = "NATIVE_CAPABILITY_ABSENT";
let nativePending = false;
let nativeRecipe = "";
let generationProvider = "openai-compatible";
let generationMode = "reference-img2img";
let referenceIntentVersion = 0;
let comparisonNormalizedUrl = null;
let ownerBlocked = false;
let batchPending = false;
let selectionPending = 0;
let activeBatch = null;
let submittedBatchId = null;
let batchVersion = 0;
let resultVersion = 0;
let resultSelectionVersion = 0;
let resultPending = false;
let reviewBinding = null;
let reviewRevision = 0;
let reviewPending = false;
const knownResults = new Map();
let comparisonVersion = 0;
let comparisonResultUrl = null;
let comparisonSourceUrl = null;
let comparisonMode = "result";
let comparisonOpacity = 50;
let comparisonSourceSize = null;
let comparisonResultSize = null;
let sourcePending = false;
const resultDrafts = new Map();
let reviewDraft = null;
let draftDestination = null;
let draftNavigationPermit = false;
let activeTask = "review";
let workstationCatalog = null;
let workstationSource = null;
let workstationIdentity = null;
let workstationPending = false;
let workstationVersion = 0;
let workstationHistoryVersion = 0;
let workstationFrameVersion = 0;
const workstationUrls = new Set();
const workstationLabels = {
	portrait: "초상",
	"fullbody-turntable": "전신 턴테이블",
	torso: "의상 포함 몸통",
	"detached-head": "분리된 머리",
	"head-without-hair-eyes-teeth": "머리 (머리카락·눈·치아 제외)",
	hair: "별도 머리카락",
	"underwear-only-torso": "직접 디자인한 속옷 전용 몸통",
};
const portraitKindLabels = { portrait: "초상" };
const reviewAuthorityLabels = { owner: "소유자 검토" };
const taskLabels = {
	review: "결과 검토",
	single: "초상 제작",
	turntable: "전신 턴테이블",
	torso: "몸통 참조",
	"detached-head": "분리된 머리 참조",
	"head-without-hair-eyes-teeth": "머리 (머리카락·눈·치아 제외)",
	hair: "별도 머리카락 참조",
	parts: "부위·참조 이미지",
	composition: "일괄 구성",
	queue: "실행 상태",
	"local-ai": "로컬 AI · 3D",
};
function switchTask(task) {
	if (task === activeTask) return;
	if (!guardDraftNavigation(() => switchTask(task))) return;
	activeTask = task;
	$("workspace").dataset.activeTask = task;
	for (const key of Object.keys(taskLabels)) {
		const button = $(`task-${key}`);
		if (key === task) button.setAttribute("aria-current", "page");
		else button.removeAttribute("aria-current");
	}
	$("task-title").textContent = taskLabels[task];
	$("local-ai-workspace").hidden = task !== "local-ai";
	$("owner-work-context").hidden = task === "local-ai";
	if (task === "local-ai" && !localAiCatalog) void loadLocalAiCatalog();
	$("review-anchors").hidden = task !== "review";
	$("review-results").hidden = task !== "review";
	$("review-layout").hidden = task !== "review" && task !== "single";
	$("review-editor").hidden = task !== "review";
	$("source-workspace").hidden = task !== "single";
	$("wiki-workspace").hidden = task !== "single" && task !== "composition";
	$("wiki-batch-options").hidden = task !== "composition";
	$("composition-workspace").hidden = task !== "composition";
	$("queue-workspace").hidden = task !== "queue";
	$("workstation-workspace").hidden = ![
		"turntable",
		"torso",
		"detached-head",
		"head-without-hair-eyes-teeth",
		"hair",
		"parts",
	].includes(task);
	if (task === "single" && workstationSource?.personId !== selected?.personId)
		void selectCharacter(workstationSource.personId);
	if (
		[
			"turntable",
			"torso",
			"detached-head",
			"head-without-hair-eyes-teeth",
			"hair",
			"parts",
		].includes(task)
	) {
		if (task === "head-without-hair-eyes-teeth") {
			clearWorkstationFrames();
			$("workstation-history").replaceChildren();
		}
		if (workstationCatalog) {
			$("workstation-category").value =
				task === "turntable"
					? "fullbody-turntable"
					: task === "torso"
						? "torso"
						: task === "detached-head"
							? "detached-head"
							: task === "head-without-hair-eyes-teeth"
								? "head-without-hair-eyes-teeth"
								: task === "hair"
									? "hair"
									: "";
			$("workstation-category").disabled = task !== "parts";
			workstationCategoryChanged();
			renderWorkstationMode();
			const personId = selected?.personId ?? $("history-person").value;
			if (
				personId &&
				$("workstation-person").value !== personId &&
				[...$("workstation-person").children].some(
					(option) => option.value === personId,
				)
			) {
				$("workstation-person").value = personId;
				void selectWorkstationPerson();
			}
			if (/^person-\d+$/.test($("workstation-person").value))
				void loadWorkstationHistory();
		} else void loadWorkstations();
	}
	$("task-title").focus();
	if (task === "review" && reviewBinding) {
		const record = [...resultDrafts.values()].find((draft) =>
			sameBinding(draft.binding, reviewBinding),
		);
		if (record) reviewDraft = record;
		updateDraftActions();
	}
}
for (const key of Object.keys(taskLabels))
	$(`task-${key}`).addEventListener("click", () => switchTask(key));
$("toggle-connection").addEventListener("click", () => {
	$("connection-disclosure").open = !$("connection-disclosure").open;
});
$("connection-disclosure").addEventListener("toggle", () => {
	$("toggle-connection").setAttribute(
		"aria-expanded",
		String($("connection-disclosure").open),
	);
});
let referenceCatalog = null;
let referencePending = false;
let referenceIdentity = null;
const batchSelection = new Map();
const selectionLoads = new Set();
const batchSummaries = new Map();
const shaPattern = /^[a-f0-9]{64}$/;
const reviewCategories = [
	["identity-and-face", "정체성과 얼굴"],
	["anatomy-and-pose", "해부와 자세"],
	["framing-and-composition", "프레이밍과 구도"],
	["technique-and-style", "기법과 스타일"],
	["transparency-and-edges", "투명도와 경계"],
	["authored-conditions", "작성된 조건"],
];
const turntableLabels = {
	front: "정면",
	profile: "프로필",
	side: "측면",
	back: "후면",
};

function text(tag, value, className) {
	const node = document.createElement(tag);
	node.textContent = String(value);
	if (className) node.className = className;
	return node;
}
function notice(id, message, error = false) {
	$(id).textContent = message;
	$(id).setAttribute("role", error ? "alert" : "status");
}
function clearUploadErrors() {
	$("upload-errors").hidden = true;
	$("upload-error-list").replaceChildren();
	for (const id of ["detail-file", "token-file", "image-file"]) {
		$(id).removeAttribute("aria-invalid");
		$(id).removeAttribute("aria-describedby");
	}
}
function showUploadErrors(code) {
	clearUploadErrors();
	const fields =
		code === "INVALID_PNG"
			? ["image-file"]
			: code === "INVALID_JSON"
				? ["detail-file", "token-file"]
				: ["detail-file", "token-file", "image-file"];
	for (const id of fields) {
		const item = document.createElement("li");
		item.id = `upload-error-${id}`;
		const link = document.createElement("a");
		link.href = `#${id}`;
		const label = document.querySelector(`label[for="${id}"]`).textContent;
		link.textContent = `${label}: ${code === "INVALID_PNG" ? "RGBA PNG 형식을 확인하세요." : "요청이 거부되었습니다. 파일을 확인하세요. 서버가 이 파일의 개별 오류를 특정하지 않았습니다."} (${code})`;
		link.addEventListener("click", (event) => {
			event.preventDefault();
			$(id).focus();
		});
		item.append(link);
		$("upload-error-list").append(item);
		$(id).setAttribute("aria-invalid", "true");
		$(id).setAttribute("aria-describedby", item.id);
	}
	$("upload-errors").hidden = false;
	$("upload-errors").focus();
	notice(
		"upload-message",
		`시트를 적용하지 않았습니다. 이전 선택을 유지합니다: ${code}`,
		true,
	);
}
function clearPreview() {
	previewVersion += 1;
	if (previewUrl) URL.revokeObjectURL(previewUrl);
	previewUrl = null;
	$("portrait").hidden = true;
	$("portrait").removeAttribute("src");
	$("preview-empty").hidden = false;
}
function setLoginLink(mode) {
	const local = mode === "local" || mode === "personal";
	$("login").href = mode === "hosted" ? "/tools/api/auth/login" : "/tools/";
	$("login").textContent = local
		? mode === "personal"
			? "새 개인 세션 시작"
			: "새 로컬 세션 시작"
		: mode === "hosted"
			? "GitHub으로 로그인"
			: "작업대 열기";
}
function clearProtected(message = "로그인이 필요합니다.") {
	const mode = session?.mode ?? loginMode;
	comfyAvailable = false;
	comfyCanvasUrl = null;
	$("comfy-canvas-link").hidden = true;
	$("comfy-canvas-link").removeAttribute("href");
	comfyWorkflows = [];
	comfyConnection = null;
	comfyReadiness = null;
	comfyPending = false;
	$("comfy-connection-panel").hidden = true;
	const personal = mode === "personal";
	const local = mode === "local" || personal;
	epoch += 1;
	jobEvents?.close();
	jobEvents = null;
	for (const wake of jobSignalWaiters.splice(0)) wake();
	historyVersion += 1;
	deferredHistoryResult = null;
	jobHistory = [];
	clearLocalAi();
	$("person-history").replaceChildren();
	$("history-person").replaceChildren(text("option", "전체 인물"));
	$("history-person").firstChild.value = "";
	notice("history-status", "");
	selectionVersion += 1;
	for (const controller of controllers) controller.abort();
	controllers.clear();
	resultDrafts.clear();
	knownResults.clear();
	$("review-results").replaceChildren();
	reviewDraft = null;
	closeDraftDialog();
	session = null;
	selected = null;
	renderActiveSheet();
	activeJob = null;
	referenceIdentity = null;
	referenceCatalog = null;
	workstationVersion += 1;
	workstationHistoryVersion += 1;
	workstationCatalog = null;
	workstationSource = null;
	workstationIdentity = null;
	workstationPending = false;
	clearWorkstationFrames();
	for (const id of [
		"workstation-person",
		"workstation-category",
		"workstation-identity",
		"workstation-history",
	])
		$(id).replaceChildren();
	$("workstation-form").reset();
	for (const id of [
		"workstation-style",
		"workstation-source-id",
		"workstation-description",
	])
		$(id).value = "";
	for (const id of [
		"workstation-source",
		"workstation-identity-status",
		"workstation-history-status",
		"workstation-capability",
		"workstation-status",
	])
		notice(id, "로그인이 필요합니다.");
	$("reference-results").replaceChildren();
	$("reference-identity").value = "";
	$("reference-style").value = "";
	connection = null;
	connectionPending = false;
	ownerBlocked = false;
	batchPending = false;
	selectionPending = 0;
	activeBatch = null;
	submittedBatchId = null;
	batchVersion += 1;
	batchSummaries.clear();
	batchSelection.clear();
	selectionLoads.clear();
	$("connection-form").reset();
	$("generation-provider").value = "credentialed";
	$("generation-seed").value = "";
	$("comfy-generation-fields").hidden = true;
	$("account-provider-form").reset();
	$("account-provider-status").textContent = "";
	$("endpoint").replaceChildren(text("option", "로그인이 필요합니다"));
	$("connection-panel").hidden = true;
	$("connection-details").replaceChildren();
	$("connection-status").textContent = "";
	connectionProvider = null;
	comfyAvailable = false;
	comfyWorkflows = [];
	comfyConnection = null;
	comfyReadiness = null;
	comfyPending = false;
	nativeCapability = null;
	nativeCapabilityReason = "NATIVE_CAPABILITY_ABSENT";
	nativePending = false;
	nativeRecipe = "";
	generationProvider = "openai-compatible";
	generationMode = "reference-img2img";
	referenceIntentVersion++;
	$("generation-mode").value = generationMode;
	$("reference-absence").checked = false;
	$("source-recipe").value = "source-045";
	$("upper-color").value = "";
	$("comfy-connection-panel").hidden = true;
	$("comfy-status").textContent = "";
	$("comfy-details").replaceChildren();
	$("generation-seed").value = "";
	renderGenerationProvider();
	$("wiki-batch-list").replaceChildren();
	$("batch-selection-list").replaceChildren();
	$("batch-selection-count").textContent = "선택 0 / 최대 20명";
	$("batch-reviewed").checked = false;
	$("batch-view").replaceChildren();
	$("batch-message").textContent = "";
	$("refresh-batch").hidden = true;
	$("cancel-batch").hidden = true;
	characters = [];
	wikiSearchVersion += 1;
	wikiNextCursor = null;
	wikiLoading = false;
	wikiPeople.clear();
	$("wiki-person").replaceChildren(text("option", "위키 인물을 선택하세요"));
	$("wiki-person").firstChild.value = "";
	$("wiki-source").replaceChildren();
	$("wiki-query").value = "";
	notice("wiki-status", "");
	$("wiki-next").hidden = true;
	pending = false;
	uploadPending = false;
	resultSelectionVersion += 1;
	resultPending = false;
	clearReview();
	clearPreview();
	for (const id of ["character-list", "sheet-view", "conditions", "receipt"])
		$(id).replaceChildren();
	$("upload-form").reset();
	clearUploadErrors();
	$("search").value = "";
	$("refresh-job").hidden = true;
	for (const id of [
		"selection-message",
		"upload-message",
		"generation-message",
		"diagnostic",
		"review-state",
		"preview-caption",
		"preview-role",
		"list-status",
	])
		$(id).textContent = "";
	$("preview-empty").textContent = local
		? personal
			? "개인 HTTPS 세션이 종료됐습니다."
			: "로컬 세션이 종료됐습니다."
		: "GitHub 로그인이 필요합니다.";
	$("portrait").alt = "";
	$("workspace").hidden = true;
	$("logout").hidden = true;
	$("login").hidden = false;
	setLoginLink(mode);
	$("identity").textContent = local
		? personal
			? "개인 세션 종료"
			: "로컬 세션 종료"
		: "로그인하지 않음";
	notice("session-message", message);
}
async function request(
	path,
	options = {},
	binary = false,
	controller = new AbortController(),
) {
	const authEpoch = epoch;
	controllers.add(controller);
	try {
		const headers = new Headers(options.headers);
		if (options.method && options.method !== "GET") {
			headers.set("X-CSRF-Token", session?.csrfToken ?? "");
			if (options.body) headers.set("Content-Type", "application/json");
		}
		const response = await fetch(`${apiBase}${path}`, {
			...options,
			headers,
			credentials: "same-origin",
			cache: "no-store",
			signal: controller.signal,
		});
		if (authEpoch !== epoch) throw new Error("STALE_RESPONSE");
		if (response.status === 401) {
			clearProtected();
			throw new Error("AUTHENTICATION_REQUIRED");
		}
		if (binary && response.ok) return response.blob();
		let payload;
		try {
			payload = await response.json();
		} catch {
			// A non-JSON body (an intermediary error page, a cut connection) says
			// nothing about whether the server accepted the request; carry the
			// status so callers can tell a definitive rejection from uncertainty.
			throw Object.assign(new Error(`INVALID_RESPONSE_${response.status}`), {
				status: response.status,
			});
		}
		if (!response.ok) {
			const code = payload?.error?.code ?? `HTTP_${response.status}`;
			if (code === "OWNER_DISPATCH_UNCERTAIN") ownerBlocked = true;
			throw Object.assign(new Error(code), { status: response.status });
		}
		if (authEpoch !== epoch) throw new Error("STALE_RESPONSE");
		return payload;
	} finally {
		controllers.delete(controller);
	}
}
function errorMessage(error) {
	return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}
function updateAction() {
	$("create-workstation").disabled = Boolean(
		!session ||
			!connectionReady() ||
			ownerBlocked ||
			workstationPending ||
			pending ||
			batchPending ||
			batchLocked() ||
			!workstationSource?.eligible ||
			!workstationIdentity,
	);
	renderGenerationProvider();
	renderNativeConnection(true);
	const providerReady =
		generationProvider === "native-moss"
			? nativeReady()
			: generationProvider === "comfyui"
				? comfyReady() &&
					`comfyui:${comfyConnection?.toolName}` === referenceModel()
				: connectionReady();
	const blocked =
		!session ||
		workstationPending ||
		!providerReady ||
		ownerBlocked ||
		batchLocked() ||
		batchPending ||
		!selected ||
		!referenceInputReady() ||
		selected?.eligible === false ||
		pending ||
		resultPending ||
		uploadPending ||
		(activeJob && !["HOLD", "FAILED"].includes(activeJob.state));
	$("generate").disabled = Boolean(blocked);
	$("create-references").disabled = Boolean(
		!session ||
			workstationPending ||
			!connectionReady() ||
			ownerBlocked ||
			batchLocked() ||
			batchPending ||
			pending ||
			uploadPending ||
			referencePending ||
			!referenceCatalog ||
			!referenceIdentity ||
			referenceIdentity.personId !== selected?.personId,
	);
	$("upload-button").disabled = pending || uploadPending;
	$("refresh-job").disabled = pending || resultPending || reviewPending;
	$("wiki-person").disabled = uploadPending;
	$("wiki-search-button").disabled = uploadPending;
	$("wiki-next").disabled = uploadPending || wikiLoading;
	if (
		ownerBlocked ||
		batchLocked() ||
		(activeJob && !["HOLD", "FAILED"].includes(activeJob.state))
	) {
		$("connect").disabled = true;
		$("endpoint").disabled = true;
		$("bridge-bearer").disabled = true;
		$("comfy-connect").disabled = true;
		$("native-connect").disabled = true;
	}
	updateBatchAction();
	$("load-review").disabled =
		!session || activeJob?.state !== "HOLD" || reviewPending;
	if (pending)
		notice(
			"generation-message",
			"생성 요청 처리 중입니다. 자동 재시도하지 않습니다.",
		);
	else if (activeJob && !["HOLD", "FAILED"].includes(activeJob.state))
		notice(
			"generation-message",
			"결과가 미확인입니다. 기존 작업 상태를 확인하세요. 새 요청은 보내지 않습니다.",
		);
	else if (ownerBlocked || batchLocked())
		notice(
			"generation-message",
			"소유자의 진행 중 또는 미확인 일괄 작업이 새 생성을 잠급니다. 연결을 바꿔 우회할 수 없습니다.",
		);
	else if (legacyIntentBlockReason())
		notice("generation-message", legacyIntentBlockReason(), true);
	else if (generationProvider === "native-moss" && nativeBlockReason())
		notice(
			"generation-message",
			`Native HOLD · ${nativeBlockReason()} · 다른 프로바이더로 자동 전환하지 않습니다.`,
			true,
		);
	else if (
		selected?.sheetId &&
		selected.source.sourceAcquisition?.status === "failed"
	)
		notice(
			"generation-message",
			"HOLD · UPLOADED_REFERENCE_IDENTITY_UNSUPPORTED · 업로드의 인물 ID·캐릭터 ID·원본 해시를 v2 계약으로 확인할 수 없습니다. 기존 방식으로 자동 제출하지 않습니다.",
			true,
		);
	else if (!providerReady)
		notice(
			"generation-message",
			generationProvider === "comfyui"
				? "ComfyUI 연결이 READY여야 텍스트 초안을 생성할 수 있습니다. 연결 설정에서 ComfyUI 연결 확인을 누르세요."
				: session?.mode === "local" || session?.mode === "personal"
					? "내 provider 연결이 READY여야 생성할 수 있습니다."
					: "내 MCP 연결이 READY여야 생성할 수 있습니다.",
		);
	else if (selected?.eligible === false)
		notice(
			"generation-message",
			`생성용 디자인 토큰 또는 원본 확인 필요: ${selected.source.generationEligibility?.reason ?? "미확인"}`,
		);
	else if (selected && !referenceInputReady())
		notice(
			"generation-message",
			"원본 확보 또는 명시적 미사용 선택을 확인하세요. 상의 색상은 비우거나 dark blue만 입력할 수 있습니다.",
			true,
		);
	else
		notice(
			"generation-message",
			selected
				? generationProvider === "comfyui"
					? generationMode === "token-only"
						? "명시적 원본 미사용: MOSS 디자인 토큰 요청을 한 번 보냅니다."
						: "선택 원본 PNG로 ComfyUI 편집 요청을 한 번 보냅니다. 실패 시 전환하지 않습니다."
					: "버튼을 누르면 이미지 생성 요청을 한 번 보냅니다."
				: "인물 또는 검증된 시트를 선택하세요.",
		);
}
function providerLabel(providerModel) {
	if (typeof providerModel !== "string") return "미확인";
	if (providerModel === nativeModel)
		return `Native MOSS · ${nativeModel} · 후보 HOLD`;
	if (providerModel === "comfyui:moss-image-sft-source-img2img.alpha.v1")
		return `ComfyUI 원본 latent 편집 · ${providerModel} · 품질 미승인`;
	return providerModel.startsWith("comfyui:")
		? `ComfyUI 텍스트 초안 · ${providerModel.slice("comfyui:".length)} · 참조 이미지 미전송`
		: `OpenAI 호환 (CLIProxy) · ${providerModel}`;
}
function exactKeys(value, keys) {
	return (
		value &&
		typeof value === "object" &&
		!Array.isArray(value) &&
		Object.keys(value).length === keys.length &&
		keys.every((key) => Object.hasOwn(value, key))
	);
}
function readNativeCapability(value) {
	if (
		!exactKeys(value, [
			"configured",
			"model",
			"profileDigest",
			"adapterSHA256",
			"recipes",
			"modes",
			"preserveOnly",
			"provisional",
			"styleStatus",
			"generationEnabled",
			"reason",
			"connection",
		]) ||
		typeof value.configured !== "boolean" ||
		value.model !== nativeModel ||
		value.profileDigest !== nativeProfileDigest ||
		value.adapterSHA256 !== nativeAdapter ||
		JSON.stringify(value.recipes) !== JSON.stringify(nativeRecipes) ||
		JSON.stringify(value.modes) !==
			JSON.stringify(["reference-img2img", "token-only"]) ||
		value.preserveOnly !== true ||
		value.provisional !== true ||
		value.styleStatus !== "HOLD" ||
		typeof value.generationEnabled !== "boolean" ||
		!(
			value.reason === null ||
			(typeof value.reason === "string" &&
				/^[A-Z][A-Z0-9_]*$/.test(value.reason))
		)
	)
		throw new Error("NATIVE_CAPABILITY_INVALID");
	if (
		value.connection !== null &&
		(!exactKeys(value.connection, [
			"connectionId",
			"state",
			"expiresAt",
			"protocolVersion",
			"profileDigest",
		]) ||
			typeof value.connection.connectionId !== "string" ||
			!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
				value.connection.connectionId,
			) ||
			!["CONNECTING", "READY", "REVOKED"].includes(value.connection.state) ||
			!Number.isFinite(value.connection.expiresAt) ||
			value.connection.protocolVersion !== "native-moss-ssh.v1" ||
			value.connection.profileDigest !== nativeProfileDigest)
	)
		throw new Error("NATIVE_CAPABILITY_INVALID");
	return value;
}
function nativeReason() {
	if (!nativeCapability) return nativeCapabilityReason;
	if (!nativeCapability.configured)
		return nativeCapability.reason ?? "NATIVE_NOT_CONFIGURED";
	if (nativeCapability.reason) return nativeCapability.reason;
	if (!nativeCapability.generationEnabled) return "NATIVE_GENERATION_DISABLED";
	if (
		nativeCapability.connection?.state !== "READY" ||
		nativeCapability.connection.expiresAt <= Date.now()
	)
		return "NATIVE_CONNECTION_NOT_READY";
	return null;
}
function nativeReady() {
	return nativeReason() === null;
}
function nativeBlockReason() {
	if (selected?.sheetId) return "NATIVE_UPLOADED_SOURCE_UNSUPPORTED";
	if ($("upper-color").value.trim()) return "NATIVE_EDIT_UNSUPPORTED";
	const allowed =
		generationMode === "token-only"
			? nativeRecipe === nativeRecipes[0]
			: nativeRecipes.slice(1).includes(nativeRecipe);
	return nativeReason() ?? (allowed ? null : "NATIVE_RECIPE_REQUIRED");
}
function renderNativeConnection(preserveError = false) {
	const live =
		nativeCapability?.connection &&
		nativeCapability.connection.state !== "REVOKED";
	const busy =
		nativePending ||
		ownerBlocked ||
		Boolean(batchLocked()) ||
		pending ||
		Boolean(activeJob && !["HOLD", "FAILED"].includes(activeJob.state));
	$("native-connect").disabled =
		!session || !nativeCapability?.configured || busy || live;
	$("native-disconnect").disabled = !live || busy;
	$("native-profile").textContent =
		`${nativeModel} · 어댑터 ${nativeAdapter} · 후보 HOLD · 승인 NONE`;
	if (!preserveError || $("native-status").getAttribute("role") !== "alert")
		notice(
			"native-status",
			`${nativeReady() ? "READY · 실행 기반 확인" : `NOT_READY · ${nativeReason()}`} / 그림체 HOLD`,
		);
}
$("native-connect").addEventListener("click", async () => {
	if ($("native-connect").disabled) return;
	const authEpoch = epoch;
	nativePending = true;
	renderNativeConnection();
	try {
		const result = await request("/connections", {
			method: "POST",
			body: JSON.stringify({ provider: "native-moss", model: nativeModel }),
		});
		if (authEpoch !== epoch) return;
		nativeCapability = readNativeCapability(result.capabilities?.nativeMoss);
		nativeCapabilityReason = "NATIVE_CAPABILITY_ABSENT";
	} catch (error) {
		if (authEpoch === epoch) {
			nativeCapability = null;
			nativeCapabilityReason = errorMessage(error);
			actionError("native-status", error);
		}
	} finally {
		if (authEpoch === epoch) {
			nativePending = false;
			renderNativeConnection(true);
			updateAction();
		}
	}
});
$("native-disconnect").addEventListener("click", async () => {
	if ($("native-disconnect").disabled) return;
	const authEpoch = epoch;
	nativePending = true;
	try {
		await request(
			`/connections/${encodeURIComponent(nativeCapability.connection.connectionId)}`,
			{ method: "DELETE" },
		);
		if (authEpoch === epoch)
			nativeCapability = { ...nativeCapability, connection: null };
	} catch (error) {
		if (authEpoch === epoch) actionError("native-status", error);
	} finally {
		if (authEpoch === epoch) {
			nativePending = false;
			renderNativeConnection(true);
			updateAction();
		}
	}
});
function retainedNativeLabel(value) {
	const request =
		value.originalRequest ??
		value.request ??
		value.job?.originalRequest ??
		value;
	return request.provider === "native-moss" ||
		request.providerModel === nativeModel
		? `${providerLabel(nativeModel)} / ${nativeRecipes.includes(request.nativeRecipe) ? request.nativeRecipe : "레시피 미확인"} / 어댑터 ${value.provenance?.native?.adapterSHA256 ?? nativeAdapter}`
		: "";
}
function comfyGenerationWorkflow() {
	const id = comfyConnection?.toolName ?? $("comfy-workflow").value;
	return comfyWorkflows.find((workflow) => workflow.id === id) ?? null;
}
function renderGenerationProvider() {
	const select = $("generation-provider");
	const openai = text("option", "OpenAI 호환 (CLIProxy) · 계정 연결");
	openai.value = "openai-compatible";
	const options = [openai];
	if (session && comfyAvailable) {
		const option = text(
			"option",
			comfyWorkflows.find(
				(entry) =>
					entry.providerModel ===
					(generationMode === "token-only"
						? "comfyui:moss-image-sft-style-male.alpha.v1"
						: "comfyui:moss-image-sft-source-img2img.alpha.v1"),
			)?.label ?? "ComfyUI · 워크플로 미확인",
		);
		option.value = "comfyui";
		options.push(option);
	}
	const nativeOption = text(
		"option",
		`Native MOSS · recovery16 후보 HOLD${nativeCapability?.configured ? "" : ` · NOT_READY / ${nativeCapabilityReason}`}`,
	);
	nativeOption.value = "native-moss";
	nativeOption.disabled = !nativeCapability?.configured;
	options.push(nativeOption);
	select.replaceChildren(...options);
	select.value = generationProvider;
	select.disabled =
		pending ||
		Boolean(activeJob && !["HOLD", "FAILED"].includes(activeJob.state));
	const comfy = generationProvider === "comfyui";
	const native = generationProvider === "native-moss";
	$("reference-preservation").textContent = native
		? generationMode === "token-only"
			? "Native 디자인 토큰 모드: 수신자 원본 이미지를 사용하지 않습니다. 작성 조건과 그림체 품질은 HOLD입니다."
			: "Native는 인물·의상·구도·시선 보존만 요청합니다. 변경 지시는 지원하지 않으며 실제 보존 품질은 HOLD입니다."
		: "인물·의상·구도·시선을 원본대로 보존합니다. 명시한 상의 색상만 변경할 수 있습니다.";
	$("upper-color-help").textContent = native
		? "Native 후보는 모든 변경 지시를 거부합니다 (NATIVE_EDIT_UNSUPPORTED). 비워 두세요."
		: "허용값은 dark blue 하나입니다. 얼굴·시선·구도 변경 지시는 받지 않습니다.";
	$("native-recipe-fields").hidden = !native;
	const recipeOptions = nativeRecipes.filter((id) =>
		generationMode === "token-only"
			? id === nativeRecipes[0]
			: id !== nativeRecipes[0],
	);
	const recipePlaceholder = text("option", "레시피를 선택하세요");
	recipePlaceholder.value = "";
	$("native-recipe").replaceChildren(
		recipePlaceholder,
		...recipeOptions.map((id) => {
			const option = text("option", `${id} · HOLD`);
			option.value = id;
			return option;
		}),
	);
	$("native-recipe").value = recipeOptions.includes(nativeRecipe)
		? nativeRecipe
		: "";
	$("native-recipe").disabled = !native || select.disabled;
	$("native-generation-status").dataset.state = nativeReady()
		? "READY"
		: "NOT_READY";
	$("native-generation-status").textContent =
		`${nativeReady() ? "READY · 실행 기반 확인" : `NOT_READY · ${nativeReason()}`} / 그림체 HOLD · 승인 NONE`;
	const sourceRecipeVisible = comfy && generationMode === "reference-img2img";
	$("source-recipe-fields").hidden = !sourceRecipeVisible;
	$("source-recipe").disabled = !sourceRecipeVisible || select.disabled;
	const workflow = comfy
		? comfyWorkflows.find((entry) => entry.providerModel === referenceModel())
		: null;
	$("comfy-generation-fields").hidden = true;
	$("generation-model").textContent = native
		? nativeModel
		: comfy
			? referenceModel()
			: model;
	$("generation-model-note").textContent = native
		? `어댑터 ${nativeAdapter} · provisional · 그림체 HOLD · 승인 NONE`
		: comfy
			? generationMode === "reference-img2img"
				? `원본 PNG → latent 초기화 · ${$("source-recipe").value} · seed 152995270030802 · 품질 미승인`
				: "MOSS 학습 화풍 후보 · 작성 디자인 토큰 · 수신자 이미지 미전송 · 스타일 미승인"
			: connectionProvider?.model && connectionProvider.model !== model
				? `계정에 저장된 모델 ${connectionProvider.model}로 전송합니다.`
				: "";
	notice(
		"generation-provider-note",
		native
			? `Native MOSS 명시 선택 · ${nativeRecipe || "레시피 미선택"} · 선택만으로 생성하지 않습니다. 자동 대체 없음.`
			: comfy
				? (workflow?.limitations ?? "ComfyUI 워크플로 제한 사항을 확인하세요.")
				: "프로바이더 선택은 요청을 보내지 않습니다. 아래 생성 버튼만 요청을 보냅니다.",
	);
}
function referenceModel() {
	if (generationProvider === "native-moss") return nativeModel;
	return generationMode === "token-only"
		? "comfyui:moss-image-sft-style-male.alpha.v1"
		: generationProvider === "comfyui"
			? "comfyui:moss-image-sft-source-img2img.alpha.v1"
			: model;
}
function usesLegacyGeneration() {
	return generationProvider === "openai-compatible" &&
		(session?.mode === "hosted" ||
			Boolean(connectionProvider?.model && connectionProvider.model !== model));
}
function legacyIntentBlockReason() {
	if (!usesLegacyGeneration()) return null;
	if (generationMode !== "reference-img2img" || $("reference-absence").checked)
		return "LEGACY_REFERENCE_EXCLUSION_UNSUPPORTED · 이 연결은 원본 미사용·디자인 토큰 모드를 지원하지 않습니다.";
	if ($("upper-color").value.trim())
		return "LEGACY_REFERENCE_EDIT_UNSUPPORTED · 이 연결은 상의 색상 편집을 지원하지 않습니다.";
	return null;
}
function legacyGenerationPayload(selection, requestId, connectionId) {
	const reason = legacyIntentBlockReason();
	if (reason) throw new Error(reason);
	return {
		requestId,
		connectionId,
		...(selection.sheetId ? { sheetId: selection.sheetId } : { personId: selection.personId }),
		providerModel: model,
		size: "1024x1536",
		faceMode: { kind: "unique", variantId: null },
	};
}
function referenceInputReady() {
	if (usesLegacyGeneration()) return !legacyIntentBlockReason() && selected?.eligible !== false &&
		(!selected?.sheetId || selected.imageState === "verified");
	if (generationProvider === "native-moss" && nativeBlockReason()) return false;
	const status = selected?.source?.sourceAcquisition?.status;
	const color = $("upper-color").value.trim();
	return generationMode === "reference-img2img"
		? status === "acquired" &&
				(!selected?.sheetId || selected.imageState === "verified") &&
				!$("reference-absence").checked &&
				(color === "" || color === "dark blue")
		: status === "intentional-absence" &&
				$("reference-absence").checked &&
				["comfyui", "native-moss"].includes(generationProvider) &&
				color === "";
}
function referenceDetails(reference) {
	const box = document.createElement("div");
	if (reference?.sourceRecipe) {
		const recipe = reference.sourceRecipe;
		box.append(
			text(
				"p",
				`원본 편집 레시피 ${recipe.id} · denoise ${recipe.denoise} · seed ${recipe.seed} · ${recipe.steps} steps · CFG ${recipe.cfg} · ${recipe.sampler} / ${recipe.scheduler}`,
			),
		);
	}
	box.append(
		text(
			"p",
			`분석 ${reference?.analysisStatus ?? "UNQUALIFIED"} · 정확도 ${reference?.accuracy ?? "NOT_ESTABLISHED"} · 모델 스냅샷 ${reference?.modelSnapshotStatus ?? "NOT_EXPOSED"}`,
		),
	);
	for (const review of reference?.semanticReview?.reviews ?? [])
		box.append(
			text(
				"p",
				`독립 검토 HOLD · ${review.failures.map((f) => `${f.field}: ${f.verdict}`).join(" / ")} · ${review.receiptSHA256}`,
			),
		);
	if (reference?.conflicts?.length)
		box.append(
			text(
				"p",
				`과거 토큰 충돌 ${reference.conflicts.length}건: 원본 모드에서 적용하지 않음`,
			),
		);
	box.append(
		text(
			"p",
			"분석은 편집 권한이나 원본 이해 완료의 증거가 아닙니다. 결과 HOLD · 승인 NONE",
		),
	);
	return box;
}
async function acquireSelectedReference() {
	const selection = selected;
	const version = ++referenceIntentVersion;
	const authEpoch = epoch;
	const current = () =>
		selected === selection &&
		version === referenceIntentVersion &&
		epoch === authEpoch;
	if (!selection) return;
	if (usesLegacyGeneration()) return;
	const absent = $("reference-absence").checked;
	if (selection.sheetId) {
		const source = selection.source;
		const valid =
			/^person-\d+$/.test(source.personId ?? "") &&
			/^K\d+$/.test(source.characterId ?? "") &&
			source.detail?.id === source.personId &&
			source.detail?.detailRoute === `/people/${source.personId}` &&
			source.detail?.familyTree?.personId === source.characterId &&
			source.token?.personId === source.personId &&
			source.token?.characterId === source.characterId &&
			source.detail?.name === source.name &&
			source.token?.name === source.name &&
			shaPattern.test(source.sourceHashes?.image ?? "") &&
			source.token?.image?.sha256 === source.sourceHashes.image;
		selection.eligible = valid;
		selection.sourceSelection = valid
			? absent
				? { kind: "intentional-absence", reason: "no-reference-available" }
				: {
						kind: "selected",
						personId: source.personId,
						sourceSHA256: source.sourceHashes.image,
					}
			: undefined;
		source.sourceAcquisition = valid
			? { status: absent ? "intentional-absence" : "acquired" }
			: {
					status: "failed",
					errorCode: "UPLOADED_REFERENCE_IDENTITY_UNSUPPORTED",
				};
		$("reference-source-status").textContent = valid
			? `${source.sourceAcquisition.status} · 업로드 ${source.personId} · ${absent ? "원본 미사용 명시" : source.sourceHashes.image}`
			: "HOLD · UPLOADED_REFERENCE_IDENTITY_UNSUPPORTED · 업로드 신원을 v2 계약으로 표현할 수 없습니다. 생성 요청은 전송하지 않습니다.";
		renderActiveSheet();
		updateAction();
		return;
	}
	const pin =
		selection.referenceSHA ??
		selection.source.sourceHashes?.image ??
		selection.source.token?.image?.sha256;
	selection.referenceSHA = pin;
	selection.source.sourceAcquisition = { status: "unresolved" };
	$("reference-source-status").textContent = absent
		? "intentional-absence · 명시 선택을 확인하고 있습니다."
		: "selected · 선택 원본을 확보하고 있습니다.";
	updateAction();
	if (!absent && !shaPattern.test(pin ?? "")) {
		selection.source.sourceAcquisition = {
			status: "failed",
			errorCode: "REFERENCE_NOT_ACQUIRED",
		};
		$("reference-source-status").textContent =
			"failed · REFERENCE_NOT_ACQUIRED · 원본 부재는 명시 선택이 필요합니다. 모드를 자동 변경하지 않습니다.";
		updateAction();
		return;
	}
	const sourceSelection = absent
		? { kind: "intentional-absence", reason: "no-reference-available" }
		: { kind: "selected", personId: selection.personId, sourceSHA256: pin };
	try {
		const query = new URLSearchParams({
			schemaVersion: "2",
			inputMode: generationMode,
			sourceSelection: JSON.stringify(sourceSelection),
		});
		const source = await request(
			`/wiki/people/${encodeURIComponent(selection.personId)}?${query}`,
		);
		if (!current()) return;
		selection.source = {
			...selection.source,
			...source,
			sourceHashes: {
				...selection.source.sourceHashes,
				...source.sourceHashes,
			},
		};
		selection.eligible = source.sourceAcquisition?.eligible === true;
		selection.imageState =
			source.sourceAcquisition?.status === "acquired"
				? "verified"
				: source.sourceAcquisition?.status === "failed"
					? "error"
					: "missing";
		renderActiveSheet();
		$("conditions").replaceChildren(
			text(
				"p",
				generationMode === "reference-img2img"
					? "원본 보존 권한: 과거 토큰의 얼굴·시선·구도 지시는 적용하지 않습니다."
					: "작성된 디자인 토큰을 사용합니다. 수신자 원본 이미지는 전송하지 않습니다.",
			),
		);
		selection.sourceSelection = sourceSelection;
		$("reference-source-status").textContent =
			`${source.sourceAcquisition?.status ?? "unresolved"} · ${source.sourceAcquisition?.errorCode ?? (absent ? "사용자가 원본 미사용을 명시했습니다." : "선택 인물의 PNG와 SHA-256 확인")} · ${pin ?? "원본 없음"}`;
		$("reference-analysis").replaceChildren(referenceDetails(source.reference));
		if (source.imageBase64 && current())
			await showRegisteredPhoto(selection.source, authEpoch, selectionVersion);
		else {
			clearPreview();
			$("preview-role").textContent = absent
				? "명시적 원본 미사용"
				: "원본 확보 실패";
			$("preview-caption").textContent =
				`${selection.source.name ?? selection.personId} · ${generationMode} · 생성 결과 아님`;
			$("preview-empty").textContent = absent
				? "명시적 원본 미사용 · 디자인 토큰 생성"
				: "원본 확보 실패 · 생성 차단";
		}
	} catch (error) {
		if (!current()) return;
		selection.source.sourceAcquisition = {
			status: "failed",
			errorCode: errorMessage(error),
		};
		selection.eligible = false;
		clearPreview();
		$("preview-role").textContent = "원본 확보 실패";
		$("preview-empty").textContent =
			"선택한 원본을 확보하지 못했습니다. 생성은 차단됩니다.";
		$("reference-source-status").textContent =
			`failed · ${errorMessage(error)} · 모드를 유지합니다. 자동 전환하지 않습니다.`;
	} finally {
		if (current()) updateAction();
	}
}
$("reference-absence").addEventListener("change", () => {
	generationMode = $("reference-absence").checked
		? "token-only"
		: "reference-img2img";
	$("generation-mode").value = generationMode;
	if (generationProvider !== "native-moss")
		generationProvider =
			generationMode === "token-only" ? "comfyui" : "openai-compatible";
	nativeRecipe = "";
	$("upper-color").value = "";
	$("upper-color").disabled = generationMode === "token-only";
	acquireSelectedReference();
});
$("generation-mode").addEventListener("change", () => {
	generationMode = $("generation-mode").value;
	$("reference-absence").checked = generationMode === "token-only";
	if (generationProvider !== "native-moss")
		generationProvider =
			generationMode === "token-only" ? "comfyui" : "openai-compatible";
	nativeRecipe = "";
	$("upper-color").value = "";
	$("upper-color").disabled = generationMode === "token-only";
	acquireSelectedReference();
});
$("upper-color").addEventListener("input", updateAction);
$("source-recipe").addEventListener("change", updateAction);
$("native-recipe").addEventListener("change", () => {
	nativeRecipe = $("native-recipe").value;
	updateAction();
});
$("generation-provider").addEventListener("change", () => {
	const value = $("generation-provider").value;
	if (value === "native-moss" && nativeCapability?.configured)
		generationProvider = value;
	else if (value === "comfyui" && comfyAvailable) generationProvider = value;
	else if (value === "openai-compatible") generationProvider = value;
	updateAction();
});
function renderValue(value, depth = 0) {
	if (value === null) return text("span", "null (원본 값)");
	if (typeof value !== "object") return text("span", String(value));
	const entries = Object.entries(value);
	if (!entries.length)
		return text("span", Array.isArray(value) ? "[] (원본 값)" : "{} (원본 값)");
	if (depth > 8) return text("pre", JSON.stringify(value, null, 2), "raw");
	const list = document.createElement("dl");
	list.className = "fields";
	for (const [key, child] of entries) {
		list.append(text("dt", key));
		const dd = document.createElement("dd");
		if (child && typeof child === "object") {
			const disclosure = document.createElement("details");
			disclosure.append(
				text(
					"summary",
					Array.isArray(child) ? `항목 ${child.length}개` : "구조 보기",
				),
			);
			const content = document.createElement("div");
			content.append(renderValue(child, depth + 1));
			disclosure.append(content);
			dd.append(disclosure);
		} else dd.append(renderValue(child, depth + 1));
		list.append(dd);
	}
	return list;
}
function renderActiveSheet(imageState = selected?.imageState ?? "missing") {
	const source = selected?.source;
	const kind = !source
		? "none"
		: selected.sheetId
			? "manual"
			: source.source?.kind === "live-wiki-http"
				? "wiki"
				: "registered";
	$("active-sheet").dataset.kind = kind;
	$("active-sheet").dataset.imageState = imageState;
	$("active-detail-label").textContent =
		kind === "wiki" ? "위키 실시간 상세 JSON" : "원본 상세 JSON";
	$("active-sheet").dataset.eligible = source
		? String(selected.eligible !== false)
		: "unknown";
	$("active-sheet-name").textContent = source
		? `${source.name ?? "이름 미확인"} / ${source.characterId ?? "ID 미확인"} / ${source.personId ?? "원본 ID 미확인"}`
		: imageState === "loading"
			? "인물 시트를 불러오고 있습니다."
			: "선택된 인물이 없습니다.";
	$("active-sheet-kind").textContent = {
		none: "",
		manual: "검증된 수동 업로드 시트",
		wiki:
			source?.sourceAcquisition?.status === "acquired"
				? "위키 상세 · 확보된 원본 PNG"
				: source?.sourceAcquisition?.status === "intentional-absence"
					? "위키 상세 · 사용자가 원본 미사용 선택"
					: source?.generationEligibility?.sourceMode === "design-token-only"
						? "위키 상세 · 디자인 토큰 (원본 사진 없음)"
						: "위키 상세 · 등록 토큰과 원본 사진",
		registered: "등록 인물 시트 자동 불러오기",
	}[kind];
	$("active-sheet-eligibility").textContent = !source
		? ""
		: selected.eligible === false
			? `생성 참조 부적격: ${source.generationEligibility?.reason ?? "등록 원본 결속 없음"}`
			: "생성 참조 적격 · 생성 요청과 제작 승인은 별도입니다.";
	for (const key of ["detail", "token", "image"]) {
		const state = !source
			? imageState === "loading"
				? "loading"
				: "missing"
			: key === "image"
				? imageState
				: source[key]
					? "loaded"
					: "missing";
		$(`active-${key}-status`).dataset.state = state;
		$(`active-${key}-status`).textContent = {
			loading: "불러오는 중",
			loaded: "불러옴",
			verified: "SHA-256 · 이미지 표시 검증됨",
			missing: "없음",
			error: "이미지 검증 실패",
		}[state];
		$(`active-${key}-hash`).textContent = source?.sourceHashes?.[key] ?? "";
	}
}
renderActiveSheet();
function renderSource(source) {
	renderActiveSheet();
	const view = $("sheet-view");
	view.replaceChildren();
	for (const [title, value] of [
		["원본 상세", source.detail],
		["작성 토큰", source.token],
		["원본 SHA-256", source.sourceHashes],
	]) {
		const section = document.createElement("div");
		section.className = "source-group";
		section.append(
			text("h3", title),
			value === undefined
				? text("p", "이 필드는 응답에 없습니다.")
				: renderValue(value),
		);
		view.append(section);
	}
	$("conditions").replaceChildren(
		source.token?.generationContract === undefined
			? text("p", "작성된 generationContract가 없습니다.")
			: renderValue(source.token.generationContract),
	);
	notice(
		"selection-message",
		`${source.name ?? "이름 미확인"} / ${source.characterId ?? "인물 ID 미확인"} / ${source.personId ?? "원본 ID 미확인"}`,
	);
}
function renderCharacters() {
	const query = $("search").value.trim().toLocaleLowerCase("ko");
	const visible = characters.filter((item) =>
		[item.name, item.personId, item.characterId].some((value) =>
			String(value ?? "")
				.toLocaleLowerCase("ko")
				.includes(query),
		),
	);
	$("character-list").replaceChildren();
	for (const item of visible) {
		const li = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		const current = selected?.personId === item.personId && !selected?.sheetId;
		button.setAttribute("aria-pressed", String(current));
		button.append(
			text("span", `${current ? "선택됨: " : ""}${item.name ?? "이름 미확인"}`),
			text("small", `${item.characterId ?? "ID 미확인"} / ${item.personId}`),
		);
		button.disabled = uploadPending;
		button.addEventListener("click", () => selectCharacter(item.personId));
		li.append(button);
		$("character-list").append(li);
	}
	notice(
		"list-status",
		visible.length
			? `${visible.length}명 표시`
			: "검색 결과가 없습니다. 검색어를 바꾸거나 시트를 불러오세요.",
	);
}
function resetJob() {
	if (reviewBinding) return;
	if (activeJob && !["HOLD", "FAILED"].includes(activeJob.state)) return;
	resultSelectionVersion += 1;
	resultPending = false;
	clearReview();
	activeJob = null;
	$("receipt").replaceChildren(text("p", "이 작업의 영수증이 없습니다."));
	$("refresh-job").hidden = true;
	$("review-state").textContent = "미확인: 검토 기록이 없습니다.";
}
async function selectCharacter(personId) {
	if (uploadPending) return;
	if (!guardDraftNavigation(() => selectCharacter(personId))) return;
	const version = ++selectionVersion;
	wikiDetailController?.abort();
	const authEpoch = epoch;
	selected = null;
	renderActiveSheet("loading");
	resetJob();
	clearPreview();
	$("sheet-view").replaceChildren();
	$("conditions").replaceChildren();
	notice("selection-message", "인물 원본을 불러오고 있습니다.");
	$("sheet-view").setAttribute("aria-busy", "true");
	updateAction();
	try {
		const source = await request(`/characters/${encodeURIComponent(personId)}`);
		if (version !== selectionVersion || authEpoch !== epoch) return;
		if (source.personId !== personId || !source.detail || !source.token)
			throw new Error("UNKNOWN_CHARACTER_RESPONSE");
		selected = { personId, source, imageState: "loading" };
		selectSharedHistoryPerson(personId);
		renderSource(source);
		await showRegisteredPhoto(source, authEpoch, version);
		if (authEpoch === epoch && version === selectionVersion)
			await acquireSelectedReference();
		if (version !== selectionVersion || authEpoch !== epoch) return;
		selected.imageState = "verified";
		renderActiveSheet();
		notice(
			"diagnostic",
			"원본 상세와 토큰을 불러왔습니다. 이미지 생성 요청은 보내지 않았습니다.",
		);
	} catch (error) {
		if (version === selectionVersion && authEpoch === epoch) {
			if (selected) selected.imageState = "error";
			renderActiveSheet();
			notice(
				"selection-message",
				`인물을 불러오지 못했습니다: ${errorMessage(error)}`,
				true,
			);
		}
	} finally {
		if (version === selectionVersion && authEpoch === epoch) {
			$("sheet-view").removeAttribute("aria-busy");
			renderCharacters();
			updateAction();
		}
	}
}
async function searchWiki(cursor = 0) {
	if (!session || uploadPending) return;
	if (cursor !== 0 && wikiLoading) return;
	const version = ++wikiSearchVersion;
	const authEpoch = epoch;
	wikiSearchController?.abort();
	wikiSearchController = new AbortController();
	if (cursor === 0) {
		wikiQuery = $("wiki-query").value.trim();
		wikiPeople.clear();
		wikiNextCursor = null;
		$("wiki-person").replaceChildren(text("option", "위키 목록을 불러오는 중"));
		$("wiki-person").firstChild.value = "";
		$("wiki-batch-list").replaceChildren();
		$("wiki-next").hidden = true;
	}
	wikiLoading = true;
	$("wiki-person").setAttribute("aria-busy", "true");
	updateAction();
	notice("wiki-status", "실제 위키 인물 목록을 조회하고 있습니다.");
	try {
		const query = new URLSearchParams({
			q: wikiQuery,
			limit: "25",
			cursor: String(cursor),
		});
		const result = await request(
			`/wiki/people?${query}`,
			{},
			false,
			wikiSearchController,
		);
		if (version !== wikiSearchVersion || authEpoch !== epoch) return;
		if (
			!Array.isArray(result.people) ||
			result.people.some(
				(person) =>
					typeof person.personId !== "string" ||
					typeof person.name !== "string",
			) ||
			result.source?.kind !== "live-wiki-http" ||
			(result.nextCursor != null &&
				(!Number.isSafeInteger(Number(result.nextCursor)) ||
					Number(result.nextCursor) <= Number(cursor)))
		)
			throw new Error("UNKNOWN_WIKI_RESPONSE");
		if (cursor === 0) {
			const placeholder = text(
				"option",
				result.people.length
					? "위키 인물을 선택하세요"
					: "검색 결과가 없습니다",
			);
			placeholder.value = "";
			$("wiki-person").replaceChildren(placeholder);
		}
		for (const person of result.people) {
			if (wikiPeople.has(person.personId)) continue;
			wikiPeople.set(person.personId, person);
			const option = text(
				"option",
				`${person.personId} / ${person.characterId ?? "ID 미확인"} / ${person.name}${person.stateName ? ` / ${person.stateName}` : ""} / ${person.generationEligibility?.eligible ? (person.generationEligibility.sourceMode === "design-token-only" ? "디자인 토큰으로 생성 가능" : "생성 가능") : "디자인 토큰 확인 필요"}`,
			);
			option.value = person.personId;
			$("wiki-person").append(option);
		}
		renderWikiBatchOptions(result.people);
		wikiNextCursor = result.nextCursor;
		$("wiki-next").hidden = wikiNextCursor == null;
		$("wiki-source").replaceChildren(renderValue(result.source));
		notice(
			"wiki-status",
			`${wikiPeople.size}명 표시 / 검색 결과 전체 ${result.total ?? "미확인"}명.${wikiNextCursor == null ? " 모두 표시했습니다." : " 다음 페이지로 계속 불러오거나 이름·ID로 검색하세요."} 생성용 원본 등록 목록과 별개입니다.`,
		);
	} catch (error) {
		if (
			version === wikiSearchVersion &&
			authEpoch === epoch &&
			error.name !== "AbortError"
		) {
			if (cursor === 0) {
				$("wiki-person").replaceChildren(text("option", "위키 조회 실패"));
				$("wiki-person").firstChild.value = "";
				$("wiki-source").replaceChildren();
			}
			notice(
				"wiki-status",
				`위키 목록을 불러오지 못했습니다: ${errorMessage(error)}`,
				true,
			);
		}
	} finally {
		if (version === wikiSearchVersion && authEpoch === epoch) {
			wikiLoading = false;
			$("wiki-person").removeAttribute("aria-busy");
			updateAction();
		}
	}
}
async function selectWiki(personId) {
	if (!personId || !session || uploadPending) return;
	if (!guardDraftNavigation(() => selectWiki(personId))) return;
	switchTask("single");
	const version = ++selectionVersion;
	const authEpoch = epoch;
	wikiDetailController?.abort();
	wikiDetailController = new AbortController();
	selected = null;
	renderActiveSheet("loading");
	resetJob();
	clearPreview();
	$("sheet-view").replaceChildren();
	$("conditions").replaceChildren();
	notice("selection-message", "실제 위키 상세 원본을 불러오고 있습니다.");
	updateAction();
	try {
		const source = await request(
			`/wiki/people/${encodeURIComponent(personId)}`,
			{},
			false,
			wikiDetailController,
		);
		if (version !== selectionVersion || authEpoch !== epoch) return;
		if (
			source.personId !== personId ||
			!source.detail ||
			source.source?.kind !== "live-wiki-http" ||
			typeof source.generationEligibility?.eligible !== "boolean"
		)
			throw new Error("UNKNOWN_WIKI_DETAIL");
		selected = {
			personId,
			source,
			eligible: source.generationEligibility.eligible,
			imageState: source.imageBase64 ? "loading" : "missing",
		};
		generationMode = "reference-img2img";
		generationProvider = "openai-compatible";
		$("generation-mode").value = generationMode;
		$("reference-absence").checked = false;
		$("upper-color").value = "";
		$("upper-color").disabled = false;
		renderSource(source);
		$("sheet-view").append(
			text("h3", "실제 위키 출처"),
			renderValue(source.source),
			text("h3", "생성 참조 결속"),
			renderValue(source.generationEligibility),
		);
		if (source.imageBase64) {
			await showRegisteredPhoto(source, authEpoch, version);
			if (version !== selectionVersion || authEpoch !== epoch) return;
			selected.imageState = "verified";
			renderActiveSheet();
		} else {
			$("preview-role").textContent = "위키 상세 원본";
			$("preview-empty").textContent = "이 인물의 등록 원본 사진이 없습니다.";
			$("preview-caption").textContent =
				source.generationEligibility.sourceMode === "design-token-only"
					? "이 인물의 디자인 토큰으로 생성합니다. 원본 사진은 사용하지 않습니다."
					: "다른 인물의 사진을 대신 표시하지 않습니다.";
		}
		notice(
			"wiki-status",
			"위키 상세를 불러왔습니다. 이미지 생성 요청은 보내지 않았습니다.",
		);
		await acquireSelectedReference();
	} catch (error) {
		if (
			version === selectionVersion &&
			authEpoch === epoch &&
			error.name !== "AbortError"
		) {
			if (selected) selected.imageState = "error";
			renderActiveSheet();
			notice(
				"selection-message",
				`위키 인물을 불러오지 못했습니다: ${errorMessage(error)}`,
				true,
			);
		}
	} finally {
		if (version === selectionVersion && authEpoch === epoch) updateAction();
	}
}
$("wiki-search-form").addEventListener("submit", (event) => {
	event.preventDefault();
	searchWiki();
});
$("wiki-next").addEventListener("click", () => {
	if (wikiNextCursor != null) searchWiki(wikiNextCursor);
});
$("wiki-person").addEventListener("change", () =>
	selectWiki($("wiki-person").value),
);
function bytesBase64(bytes) {
	let binary = "";
	for (let offset = 0; offset < bytes.length; offset += 32768)
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
	return btoa(binary);
}
async function showRegisteredPhoto(source, authEpoch, version) {
	const bytes = Uint8Array.from(atob(source.imageBase64), (char) =>
		char.charCodeAt(0),
	);
	const digest = [
		...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
	]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	if (authEpoch !== epoch || version !== selectionVersion) return;
	if (digest !== source.sourceHashes.image)
		throw new Error("ORIGINAL_IMAGE_HASH_MISMATCH");
	await showPreview(
		new Blob([bytes], { type: "image/png" }),
		"등록 원본 사진",
		`${source.name}의 원본 사진 · 생성 결과 아님`,
		authEpoch,
		version,
	);
}
async function showPreview(
	blob,
	role,
	caption,
	authEpoch,
	version,
	current = () => authEpoch === epoch && version === selectionVersion,
) {
	if (!current()) return;
	clearPreview();
	const imageVersion = previewVersion;
	previewUrl = URL.createObjectURL(blob);
	const image = $("portrait");
	const decoded = new Promise((resolve, reject) => {
		image.onload = () => {
			if (imageVersion !== previewVersion || !current()) {
				resolve();
				return;
			}
			image.hidden = false;
			$("preview-empty").hidden = true;
			$("preview-caption").textContent =
				`${caption} / 실제 ${image.naturalWidth} × ${image.naturalHeight}px`;
			resolve();
		};
		image.onerror = () => {
			if (imageVersion !== previewVersion || !current()) {
				resolve();
				return;
			}
			clearPreview();
			$("preview-empty").textContent =
				"PNG를 표시하지 못했습니다. 진단을 확인하세요.";
			notice("diagnostic", "IMAGE_DECODE_FAILED", true);
			reject(new Error("IMAGE_DECODE_FAILED"));
		};
	});
	$("preview-role").textContent = role;
	image.alt = `${role.includes("생성 결과") ? (activeJob?.source?.name ?? "결과 인물") : (selected?.source?.name ?? "선택 인물")} ${role}`;
	image.src = previewUrl;
	await decoded;
}
$("upload-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	if (!session || pending || uploadPending) return;
	const files = ["detail-file", "token-file", "image-file"].map(
		(id) => $(id).files[0],
	);
	if (files.some((file) => !file)) return;
	if (!guardDraftNavigation(() => applyUpload(files))) return;
	await applyUpload(files);
});
async function applyUpload(files) {
	if (!session || pending || uploadPending) return;
	draftNavigationPermit = false;
	const authEpoch = epoch;
	let applied = false;
	let appliedVersion = null;
	uploadPending = true;
	updateAction();
	renderCharacters();
	notice("upload-message", "원본 바이트를 읽고 서버에서 검증하고 있습니다.");
	try {
		if (
			files.some(
				(file, index) => file.size > (index === 2 ? 8 : 1) * 1024 * 1024,
			)
		)
			throw new Error("UPLOAD_FILE_TOO_LARGE");
		const bytes = await Promise.all(
			files.map(async (file) => new Uint8Array(await file.arrayBuffer())),
		);
		if (authEpoch !== epoch) return;
		const body = JSON.stringify({
			detailBase64: bytesBase64(bytes[0]),
			tokenBase64: bytesBase64(bytes[1]),
			imageBase64: bytesBase64(bytes[2]),
		});
		if (new TextEncoder().encode(body).length > 12 * 1024 * 1024)
			throw new Error("UPLOAD_REQUEST_TOO_LARGE");
		const accepted = await request("/sheets", { method: "POST", body });
		if (authEpoch !== epoch) return;
		if (typeof accepted.sheetId !== "string" || !accepted.sourceHashes)
			throw new Error("UNKNOWN_SHEET_RESPONSE");
		const decoder = new TextDecoder("utf-8", { fatal: true });
		const source = {
			...accepted,
			detail: JSON.parse(decoder.decode(bytes[0])),
			token: JSON.parse(decoder.decode(bytes[1])),
		};
		const version = ++selectionVersion;
		appliedVersion = version;
		selected = { sheetId: accepted.sheetId, source, imageState: "loading" };
		resetJob();
		renderSource(source);
		await showPreview(
			new Blob([bytes[2]], { type: "image/png" }),
			"검증된 업로드 원본",
			"생성 결과가 아닌 업로드 원본",
			authEpoch,
			version,
		);
		if (authEpoch !== epoch || version !== selectionVersion) return;
		selected.imageState = "verified";
		await acquireSelectedReference();
		renderActiveSheet();
		clearUploadErrors();
		applied = true;
		notice(
			"upload-message",
			`시트를 적용했습니다. sheetId: ${accepted.sheetId}`,
		);
	} catch (error) {
		if (authEpoch === epoch) {
			if (appliedVersion === selectionVersion && selected) {
				selected.imageState = "error";
				renderActiveSheet();
			}
			showUploadErrors(errorMessage(error));
		}
	} finally {
		if (authEpoch === epoch) {
			uploadPending = false;
			updateAction();
			renderCharacters();
			if (applied) $("upload-button").focus();
		}
	}
}
function renderJob(job, source) {
	const receipt = $("receipt");
	receipt.replaceChildren(
		text(
			"p",
			`대상: ${source?.name ?? "미확인"} / ${source?.characterId ?? "미확인"}`,
		),
	);
	const recognized = ["HOLD", "FAILED", "UNKNOWN"].includes(job.state);
	receipt.append(
		text(
			"strong",
			recognized ? job.state : `미확인: ${String(job.state)}`,
			"verdict",
		),
	);
	receipt.append(text("p", `작업 ID: ${job.id ?? "미확인"}`, "meta"));
	if (typeof job.providerModel === "string")
		receipt.append(
			text("p", `요청 프로바이더: ${providerLabel(job.providerModel)}`, "meta"),
		);
	if (retainedNativeLabel(job))
		receipt.append(text("p", retainedNativeLabel(job), "meta"));
	if (job.reference) receipt.append(referenceDetails(job.reference));
	if (job.errorCode) receipt.append(text("p", `오류 코드: ${job.errorCode}`));
	receipt.append(text("h3", "반환된 수치 측정값"));
	const metrics =
		job.metrics && typeof job.metrics === "object"
			? Object.fromEntries(
					Object.entries(job.metrics).filter(
						([, value]) =>
							value === null ||
							(typeof value === "number" && Number.isFinite(value)),
					),
				)
			: {};
	receipt.append(
		Object.keys(metrics).length
			? renderValue(metrics)
			: text("p", "반환된 수치 측정값이 없습니다."),
	);
	if ("coreFraction" in metrics)
		receipt.append(
			text(
				"p",
				"coreFraction: 캔버스 전체 대비 불투명 핵심 화소 비율입니다. 전경 합격 점수가 아닙니다.",
				"meta",
			),
		);
	if ("foregroundCoreFraction" in metrics)
		receipt.append(
			text(
				"p",
				metrics.foregroundCoreFraction === null &&
					metrics.foregroundPixels === 0
					? "foregroundCoreFraction: 측정 불가 (원본 null). 분모 foregroundPixelsAlphaGreaterThanZero의 전경 화소 수가 0입니다. 전체 합격 판정은 별도 증거가 필요합니다."
					: "foregroundCoreFraction: alpha > 0 전경 대비 alpha >= 250 핵심 화소 비율입니다. 분모는 foregroundPixelsAlphaGreaterThanZero입니다. 전체 합격 판정은 별도 증거가 필요합니다.",
				"meta",
			),
		);
	const extra = Object.fromEntries(
		Object.entries(job).filter(
			([key]) =>
				![
					"id",
					"state",
					"reviewStatus",
					"imageUrl",
					"metrics",
					"errorCode",
					"source",
					"providerModel",
				].includes(key),
		),
	);
	if (Object.keys(extra).length)
		receipt.append(text("h3", "추가 반환 정보"), renderValue(extra));
	if (source?.sourceHashes)
		receipt.append(
			text("h3", "요청 원본 SHA-256"),
			renderValue(source.sourceHashes),
		);
	$("review-state").textContent =
		job.reviewStatus === "HOLD"
			? "HOLD: 독립적인 전체 검증 증거가 없어 서버 정책상 보류되었습니다."
			: `미확인: ${job.reviewStatus === undefined ? "검토 기록이 없습니다." : String(job.reviewStatus)}`;
	$("refresh-job").hidden = typeof job.id !== "string";
	if (["UNKNOWN", "HOLD"].includes(job.state) && typeof job.id === "string") {
		const button = text("button", "원본 요청과 전송 증거 읽기");
		button.type = "button";
		const details = document.createElement("div");
		details.setAttribute("role", "status");
		button.addEventListener("click", async () => {
			button.disabled = true;
			details.replaceChildren(text("p", "읽기 전용 증거를 확인하고 있습니다."));
			try {
				const result = await request(
					`/jobs/${encodeURIComponent(job.id)}/inspection`,
				);
				if (activeJob?.id !== job.id || !details.isConnected) return;
				const inspection = result.inspection;
				if (inspection?.requestId !== job.id || inspection.readOnly !== true)
					throw new Error("INVALID_INSPECTION_RESPONSE");
				details.replaceChildren(
					text("h3", "읽기 전용 요청 조사 · HOLD"),
					text(
						"p",
						"원본 요청과 보존된 파일을 읽습니다. 결과 미확인은 그대로 유지되며 재전송하거나 승인하지 않습니다.",
					),
					renderValue(inspection),
				);
			} catch (error) {
				if (details.isConnected)
					details.replaceChildren(
						text("p", `조사 증거를 읽지 못했습니다: ${errorMessage(error)}`),
					);
			} finally {
				button.disabled = false;
			}
		});
		receipt.append(button, details);
	}
}
async function receiveJob(
	job,
	source,
	authEpoch,
	version,
	current = () => authEpoch === epoch && version === selectionVersion,
) {
	if (!current()) return;
	if (!job || typeof job.id !== "string")
		throw new Error("UNKNOWN_JOB_RESPONSE");
	const providerModel =
		typeof job.providerModel === "string"
			? job.providerModel
			: activeJob?.id === job.id && typeof activeJob.providerModel === "string"
				? activeJob.providerModel
				: undefined;
	const carried = {
		...((job.originalRequest ??
		(activeJob?.id === job.id ? activeJob.originalRequest : null))
			? { originalRequest: job.originalRequest ?? activeJob.originalRequest }
			: {}),
		...(providerModel === undefined ? {} : { providerModel }),
		...((job.reference ?? activeJob?.reference)
			? { reference: job.reference ?? activeJob.reference }
			: {}),
	};
	if (activeJob?.id === job.id && reviewBinding?.jobId === job.id) {
		activeJob = { ...job, ...carried, source: activeJob.source };
		renderJob(activeJob, activeJob.source);
		return;
	}
	clearReview();
	activeJob = { ...job, ...carried, source };
	if (job.state === "UNKNOWN") ownerBlocked = true;
	renderJob(activeJob, source);
	clearPreview();
	$("preview-role").textContent = "생성 결과";
	$("preview-empty").textContent = "이 작업에 표시할 생성 PNG가 없습니다.";
	if (job.imageUrl != null) {
		const expected = `${apiBase}/jobs/${encodeURIComponent(job.id)}/image`;
		if (job.imageUrl !== expected) throw new Error("UNEXPECTED_IMAGE_URL");
		const blob = await request(
			`/jobs/${encodeURIComponent(job.id)}/image`,
			{},
			true,
		);
		if (!current() || activeJob?.id !== job.id) return;
		if (blob.type.split(";")[0] !== "image/png")
			throw new Error("INVALID_IMAGE_CONTENT_TYPE");
		await showPreview(
			blob,
			"생성 결과 (승인 아님)",
			`작업 ${job.id}`,
			authEpoch,
			version,
			current,
		);
		if (job.state === "HOLD" && current() && activeJob?.id === job.id)
			await loadReview(blob);
	}
}
$("generate").addEventListener("click", async () => {
	if ($("generate").disabled || !selected || !session) return;
	const selection = selected;
	if (!guardDraftNavigation(() => generateSelection(selection))) return;
	await generateSelection(selection);
});
async function generateSelection(selection) {
	if (!session || pending || uploadPending) return;
	// Provider choice is explicit and validated before the single request. A
	// ComfyUI draft needs its own READY connection and sends text only.
	const comfy = generationProvider === "comfyui";
	const native = generationProvider === "native-moss";
	if (native && nativeBlockReason()) {
		notice("generation-message", `Native HOLD · ${nativeBlockReason()}`, true);
		return;
	}
	const workflow = comfy ? comfyGenerationWorkflow() : null;
	if (comfy && (!workflow || !comfyReady())) {
		notice(
			"generation-message",
			"ComfyUI 연결과 워크플로를 먼저 확인하세요. 요청을 보내지 않았습니다.",
			true,
		);
		return;
	}
	const legacyBlockReason = legacyIntentBlockReason();
	if (legacyBlockReason) {
		notice("generation-message", legacyBlockReason, true);
		return;
	}
	if (!referenceInputReady()) return;
	const seedText = "";
	const seed = seedText === "" ? undefined : Number(seedText);
	if (seed !== undefined && !(Number.isSafeInteger(seed) && seed >= 0)) {
		notice(
			"generation-message",
			"ComfyUI 시드는 0 이상의 정수여야 합니다. 요청을 보내지 않았습니다.",
			true,
		);
		return;
	}
	const legacy = usesLegacyGeneration();
	const providerModel = legacy ? model : referenceModel();
	const connectionId = native
		? nativeCapability.connection.connectionId
		: comfy
			? comfyConnection.connectionId
			: connection.connectionId;
	draftNavigationPermit = false;
	const authEpoch = epoch;
	const version = selectionVersion;
	const requestId = crypto.randomUUID();
	pending = true;
	activeJob = {
		id: requestId,
		state: "UNKNOWN",
		source: selection.source,
		providerModel,
		originalRequest: {
			provider: generationProvider,
			providerModel,
			nativeRecipe: native ? nativeRecipe : undefined,
			inputMode: generationMode,
		},
	};
	updateAction();
	renderCharacters();
	renderJob(activeJob, selection.source);
	clearReview();
	clearPreview();
	$("preview-role").textContent = "생성 요청 대기";
	$("preview-caption").textContent =
		`현재 요청 ${requestId}. 이전 이미지와 별개입니다.`;
	$("preview-empty").textContent = "생성 요청을 처리하고 있습니다.";
	try {
		const payload = legacy ? legacyGenerationPayload(selection, requestId, connectionId) : {
			schemaVersion: 2,
			generationProfile: native || comfy ? "native340-v1" : "cpa340-padded-v1",
			requestId,
			connectionId,
			...(selection.sheetId
				? { sheetId: selection.sheetId }
				: { personId: selection.personId }),
			providerModel,
			provider: generationProvider,
			inputMode: generationMode,
			...(native ? { nativeRecipe } : {}),
			sourceSelection: selection.sourceSelection,
			...(comfy && generationMode === "reference-img2img"
				? { sourceRecipe: $("source-recipe").value }
				: {}),
			explicitEdits: $("upper-color").value.trim()
				? [
						{
							field: "outfit.upper.color",
							operation: "replace",
							value: $("upper-color").value.trim(),
						},
					]
				: [],
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		let job;
		try {
			job = (
				await request("/generations", {
					method: "POST",
					body: JSON.stringify(payload),
				})
			).job;
		} catch (error) {
			// A definitive server rejection (4xx with an error code) means no job
			// exists. Anything else (network cut, intermediary timeout, 5xx)
			// leaves the server job possibly still running: follow it by id until
			// it reaches a terminal state instead of declaring the result unknown.
			// The request is never resent.
			if (
				authEpoch !== epoch ||
				version !== selectionVersion ||
				(typeof error?.status === "number" && error.status < 500) ||
				["AUTHENTICATION_REQUIRED", "STALE_RESPONSE"].includes(
					errorMessage(error),
				)
			)
				throw error;
			job = await followJob(
				requestId,
				selection.source,
				authEpoch,
				version,
				error,
			);
			if (!job) return;
		}
		await receiveJob(job, selection.source, authEpoch, version);
		if (authEpoch === epoch) await loadJobHistory();
		if (authEpoch === epoch)
			notice(
				"diagnostic",
				"반환된 작업 상태와 측정값을 확인하세요. 전체 기계 검증이나 소유자 승인을 뜻하지 않습니다.",
			);
	} catch (error) {
		if (authEpoch === epoch && version === selectionVersion) {
			if (typeof error?.status === "number" && error.status < 500)
				activeJob = {
					...activeJob,
					state: "FAILED",
					errorCode: errorMessage(error),
				};
			$("preview-empty").textContent =
				"생성 결과가 미확인입니다. 기존 작업 상태를 확인하세요.";
			notice(
				"diagnostic",
				`요청 결과를 확인하지 못했습니다. 기존 작업 ID를 보존합니다: ${errorMessage(error)}`,
				true,
			);
		}
	} finally {
		if (authEpoch === epoch) {
			pending = false;
			updateAction();
			renderCharacters();
		}
	}
}
// Follows one server job by id until it leaves RUNNING, waking on each server
// job event (SSE `/jobs/events`; the server emits at job start and end and on
// every (re)connect). Returns the terminal job, or null when the follow was
// abandoned (logout, selection change, or the server has no such job).
async function followJob(jobId, source, authEpoch, version, cause) {
	const current = () => authEpoch === epoch && version === selectionVersion;
	$("preview-empty").textContent =
		"응답이 끊기었습니다. 서버 작업 상태를 종료 상태까지 따라가는 중입니다. 새 요청은 보내지 않습니다.";
	notice(
		"diagnostic",
		`요청 응답을 받지 못했습니다 (${errorMessage(cause)}). 작업 ${jobId}의 서버 상태를 따라갑니다. 재전송하지 않습니다.`,
	);
	for (;;) {
		if (!current()) return null;
		let job;
		try {
			job = (await request(`/jobs/${encodeURIComponent(jobId)}`)).job;
			if (!job || typeof job.id !== "string")
				throw new Error("UNKNOWN_JOB_RESPONSE");
		} catch (error) {
			if (!current()) return null;
			if (error?.status === 404) {
				$("preview-empty").textContent =
					"생성 결과가 미확인입니다. 서버에 이 작업 기록이 없습니다. 새 요청은 보내지 않았습니다.";
				notice(
					"diagnostic",
					`서버에 작업 ${jobId} 기록이 없습니다. 요청이 도달하지 않았거나 거부됐을 수 있습니다: ${errorMessage(cause)}`,
					true,
				);
				return null;
			}
			if (
				["AUTHENTICATION_REQUIRED", "STALE_RESPONSE"].includes(
					errorMessage(error),
				)
			)
				return null;
			notice(
				"diagnostic",
				`작업 ${jobId} 상태 조회에 실패했습니다. 다음 서버 이벤트에서 다시 확인합니다: ${errorMessage(error)}`,
				true,
			);
			await nextJobSignal();
			continue;
		}
		if (job.state !== "RUNNING") return job;
		activeJob = {
			...job,
			...(typeof activeJob?.providerModel === "string"
				? { providerModel: activeJob.providerModel }
				: {}),
			source,
		};
		renderJob(activeJob, source);
		$("preview-empty").textContent =
			`서버 작업 ${jobId} 진행 중(RUNNING). 종료 상태까지 따라가는 중이며 새 요청은 보내지 않습니다.`;
		await nextJobSignal();
	}
}
function openJobEvents() {
	if (typeof EventSource === "undefined") return;
	jobEvents = new EventSource(`${apiBase}/jobs/events`);
	jobEvents.onmessage = () => {
		void loadJobHistory();
		for (const wake of jobSignalWaiters.splice(0)) wake();
	};
}
function nextJobSignal() {
	return new Promise((resolve) => {
		jobSignalWaiters.push(resolve);
		// Without a server event stream the follow still advances on a timer.
		if (!jobEvents && typeof setTimeout === "function")
			setTimeout(resolve, 15000);
	});
}
$("refresh-job").addEventListener("click", async () => {
	if (!activeJob || pending || resultPending || reviewPending || !session)
		return;
	const job = activeJob;
	const authEpoch = epoch;
	const version = selectionVersion;
	pending = true;
	updateAction();
	renderCharacters();
	try {
		const result = await request(`/jobs/${encodeURIComponent(job.id)}`);
		await receiveJob(result.job, job.source, authEpoch, version);
	} catch (error) {
		if (authEpoch === epoch && version === selectionVersion)
			notice(
				"diagnostic",
				`작업 상태를 확인하지 못했습니다: ${errorMessage(error)}`,
				true,
			);
	} finally {
		if (authEpoch === epoch) {
			pending = false;
			updateAction();
			renderCharacters();
		}
	}
});
$("logout").addEventListener("click", async () => {
	if (!session) return;
	if (!guardDraftNavigation(() => $("logout").click(), true)) return;
	const authEpoch = epoch;
	$("logout").disabled = true;
	try {
		await request("/auth/logout", { method: "POST" });
		if (authEpoch === epoch) clearProtected("로그아웃했습니다.");
	} catch (error) {
		if (authEpoch === epoch)
			notice(
				"session-message",
				`로그아웃하지 못했습니다: ${errorMessage(error)}`,
				true,
			);
	} finally {
		$("logout").disabled = false;
	}
});
$("search").addEventListener("input", renderCharacters);
const scheme = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
	document.documentElement.dataset.suiTheme =
		$("theme").value === "system"
			? scheme.matches
				? "dark"
				: "light"
			: $("theme").value;
}
$("theme").addEventListener("change", applyTheme);
scheme.addEventListener("change", applyTheme);
applyTheme();
addEventListener("pagehide", () => {
	jobEvents?.close();
	for (const controller of controllers) controller.abort();
	$("bridge-bearer").value = "";
	$("account-provider-key").value = "";
	clearPreview();
});

async function start() {
	const authEpoch = epoch;
	try {
		const result = await request("/auth/session");
		if (authEpoch !== epoch) return;
		if (
			result.authenticated !== true ||
			typeof result.user?.login !== "string" ||
			typeof result.csrfToken !== "string"
		) {
			clearProtected("로그인 상태를 확인하지 못했습니다.");
			return;
		}
		session = result;
		loginMode = result.mode;
		const personal = result.mode === "personal";
		const local = result.mode === "local" || personal;
		const serverProvider = personal && result.serverProviderConfigured === true;
		comfyAvailable = result.comfyuiConfigured === true;
		$("account-provider-panel").hidden = !personal;
		$("comfy-connection-panel").hidden = result.comfyuiConfigured !== true;
		if (personal) await loadAccountProvider();
		if (authEpoch !== epoch) return;
		$("connection-form").hidden = serverProvider || personal;
		$("local-provider-fields").hidden = !local || serverProvider;
		$("provider-url").required = local && !serverProvider;
		$("endpoint").hidden = local;
		document.querySelector('label[for="endpoint"]').hidden = local;
		$("endpoint").required = !local;
		$("connection-title").textContent = local
			? "OpenAI 호환 (CLIProxy) provider 연결"
			: "내 MCP 연결";
		$("connection-explanation").textContent = serverProvider
			? "소유자가 서버에 설정한 내 provider를 이 인증 세션에 자동으로 연결합니다. URL이나 API key를 입력할 필요가 없으며 키는 브라우저에 전달되지 않습니다. 연결 해제 후에는 새 개인 세션에서 다시 연결됩니다."
			: local
				? personal
					? "내 프로바이더 연결에서 URL, API key와 이미지 모델을 계정에 저장하세요. 새 세션에서도 저장한 연결을 사용합니다."
					: "URL과 API key는 이 컴퓨터에서 실행 중인 작업대에만 전달합니다. 키는 서버 메모리에만 유지하며 브라우저 저장소나 결과 파일에 보관하지 않습니다."
				: "검토된 endpoint를 선택하여 명시적으로 연결합니다. 토큰은 브라우저 저장소에 보관하지 않습니다.";
		document.querySelector('label[for="bridge-bearer"]').textContent = local
			? "API key"
			: "Bridge bearer";
		$("bridge-bearer").required = !serverProvider;
		$("connect").textContent = local ? "내 provider 연결" : "내 MCP 연결";
		$("logout").textContent = local
			? personal
				? "개인 세션 종료"
				: "로컬 세션 종료"
			: "로그아웃";
		$("connection-panel").hidden = false;
		loadConnections();
		searchWiki();
		$("workspace").hidden = false;
		await loadJobHistory();
		if (authEpoch !== epoch) return;
		openJobEvents();
		$("logout").hidden = false;
		$("login").hidden = true;
		$("identity").textContent = local
			? personal
				? `개인 HTTPS 작업대 · ${result.user.login}`
				: "이 컴퓨터의 로컬 작업대"
			: `GitHub ${result.user.login}`;
		notice(
			"session-message",
			local
				? personal
					? serverProvider
						? "Access 소유자 확인이 완료됐습니다. 서버에 설정된 내 provider 연결을 확인하고 인물 또는 원본 시트를 선택하세요."
						: "Access 소유자 확인이 완료됐습니다. 내 provider를 명시적으로 연결하고 인물 또는 원본 시트를 선택하세요."
					: "로컬 세션이 준비됐습니다. 내 provider를 연결하고 인물 또는 원본 시트를 선택하세요."
				: "GitHub으로 로그인했습니다. 인물을 선택하거나 원본 시트를 불러오세요.",
		);
		notice("list-status", "등록 인물을 불러오고 있습니다.");
		const resultList = await request("/characters");
		if (authEpoch !== epoch) return;
		if (
			!Array.isArray(resultList.characters) ||
			resultList.characters.some((item) => typeof item.personId !== "string")
		)
			throw new Error("UNKNOWN_CHARACTER_LIST");
		characters = resultList.characters;
		renderCharacters();
	} catch (error) {
		if (authEpoch === epoch)
			notice(
				session ? "list-status" : "session-message",
				`상태를 확인하지 못했습니다: ${errorMessage(error)}`,
				true,
			);
	}
	updateAction();
}
async function loadJobHistory() {
	if (!session) return;
	const authEpoch = epoch;
	const version = ++historyVersion;
	try {
		const owned = await request("/jobs");
		if (authEpoch !== epoch || version !== historyVersion) return;
		jobHistory =
			owned.history ?? (owned.jobs ?? []).map((job) => ({ job, source: null }));
		jobHistory.sort((a, b) => {
			const at = Date.parse(a.createdAt);
			const bt = Date.parse(b.createdAt);
			const ak = Number.isFinite(at);
			const bk = Number.isFinite(bt);
			return (
				(ak && bk ? bt - at : Number(bk) - Number(ak)) ||
				a.job.id.localeCompare(b.job.id)
			);
		});
		const currentJob = jobHistory.find(
			(entry) => entry.job.id === activeJob?.id,
		);
		const completed = currentJob?.job.imageUrl && !activeJob?.imageUrl;
		if (completed)
			deferredHistoryResult = {
				...currentJob,
				authEpoch,
				selectionVersion,
				resultSelectionVersion,
			};
		if (currentJob) {
			const refreshed = {
				...currentJob.job,
				originalRequest:
					currentJob.originalRequest ??
					currentJob.job.originalRequest ??
					activeJob.originalRequest,
				reference: currentJob.reference ?? activeJob.reference,
				...(typeof currentJob.providerModel === "string"
					? { providerModel: currentJob.providerModel }
					: typeof activeJob?.providerModel === "string"
						? { providerModel: activeJob.providerModel }
						: {}),
				source: activeJob.source,
			};
			if (reviewPending) Object.assign(activeJob, refreshed);
			else activeJob = refreshed;
		}
		ownerBlocked = owned.lease?.admissionBlocked === true;
		const personId = $("history-person").value;
		const placeholder = text("option", "전체 인물");
		placeholder.value = "";
		$("history-person").replaceChildren(placeholder);
		const people = new Map(
			jobHistory
				.filter((entry) => entry.source)
				.map((entry) => [entry.source.personId, entry.source]),
		);
		for (const source of people.values()) {
			const option = text(
				"option",
				`${source.name} / ${source.characterId} / ${source.personId}`,
			);
			option.value = source.personId;
			$("history-person").append(option);
		}
		$("history-person").value = people.has(personId) ? personId : "";
		renderJobHistory();
		updateAction();
		renderComfyConnection(true);
		await displayDeferredHistoryResult();
	} catch (error) {
		if (authEpoch === epoch)
			notice(
				"history-status",
				`이력을 불러오지 못했습니다: ${errorMessage(error)}`,
				true,
			);
	}
}
async function displayDeferredHistoryResult() {
	const entry = deferredHistoryResult;
	if (
		entry &&
		(entry.authEpoch !== epoch ||
			entry.selectionVersion !== selectionVersion ||
			entry.resultSelectionVersion !== resultSelectionVersion)
	) {
		deferredHistoryResult = null;
		return;
	}
	if (
		!entry ||
		entry.job.id !== activeJob?.id ||
		activeTask !== "review" ||
		resultPending ||
		reviewBinding
	)
		return;
	const authEpoch = epoch;
	const version = resultSelectionVersion;
	const current = () =>
		authEpoch === epoch &&
		version === resultSelectionVersion &&
		activeTask === "review" &&
		activeJob?.id === entry.job.id;
	await receiveJob(entry.job, entry.source, authEpoch, version, current);
	if (current()) deferredHistoryResult = null;
}
function renderJobHistory() {
	const personId = $("history-person").value;
	$("person-history").replaceChildren();
	const visible = jobHistory.filter(
		(entry) => !personId || entry.source?.personId === personId,
	);
	const groups = new Map();
	for (const entry of visible) {
		const key = entry.source?.personId ?? "unknown";
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(entry);
	}
	for (const entries of groups.values()) {
		const source = entries[0].source;
		const group = document.createElement("section");
		group.className = "portrait-history-person";
		group.dataset.personId = source?.personId ?? "unknown";
		group.append(
			text(
				"h3",
				`${source?.name ?? "원본 식별 불가"} / ${source?.characterId ?? "ID 미확인"} / ${source?.personId ?? "시트 미확인"}`,
			),
		);
		const jobs = document.createElement("div");
		jobs.className = "portrait-history-jobs";
		for (const entry of entries) {
			const kind = entry.classification?.kind ?? "portrait";
			const authority = entry.classification?.reviewAuthority ?? "owner";
			const button = text(
				"button",
				`${portraitKindLabels[kind] ?? kind} / 작업 ${entry.job.id} / ${entry.job.state} / ${reviewAuthorityLabels[authority] ?? authority} / 승인 ${entry.job.approval ?? "NONE"} / ${Number.isFinite(Date.parse(entry.createdAt)) ? entry.createdAt : "시간 미확인"}${retainedNativeLabel(entry) ? ` / ${retainedNativeLabel(entry)}` : typeof entry.providerModel === "string" ? ` / ${providerLabel(entry.providerModel)}` : ""}`,
			);
			button.type = "button";
			button.dataset.jobId = entry.job.id;
			button.dataset.kind = kind;
			button.dataset.reviewAuthority = authority;
			button.setAttribute(
				"aria-pressed",
				String(activeJob?.id === entry.job.id),
			);
			button.addEventListener("click", () => selectHistoryJob(entry));
			jobs.append(button);
			if (entry.reference) jobs.append(referenceDetails(entry.reference));
		}
		group.append(jobs);
		$("person-history").append(group);
	}
	notice(
		"history-status",
		`표시한 초상 작업 ${visible.length}건 · 인물 ${groups.size}명 / 서버 보관 전체 ${jobHistory.length}건 · 작업 UUID, 종류, 검토 권한을 보관합니다. HOLD는 후보이며 사람의 승인과 다릅니다.`,
	);
}
function selectSharedHistoryPerson(personId) {
	if (
		personId &&
		[...$("history-person").children].some(
			(option) => option.value === personId,
		)
	)
		$("history-person").value = personId;
	renderJobHistory();
}
async function selectHistoryJob(entry) {
	if (activeJob?.id === entry.job.id && reviewBinding?.jobId === entry.job.id) {
		switchTask("review");
		return;
	}
	if (
		!session ||
		pending ||
		!guardDraftNavigation(() => selectHistoryJob(entry))
	)
		return;
	const authEpoch = epoch;
	const version = ++resultSelectionVersion;
	const selection = ++selectionVersion;
	const current = () =>
		authEpoch === epoch &&
		version === resultSelectionVersion &&
		selection === selectionVersion;
	wikiDetailController?.abort();
	clearReview();
	clearPreview();
	activeJob = {
		...entry.job,
		originalRequest: entry.originalRequest ?? entry.job.originalRequest,
		reference: entry.reference,
		...(typeof entry.providerModel === "string"
			? { providerModel: entry.providerModel }
			: {}),
		source: entry.source,
	};
	renderJobHistory();
	deferredHistoryResult = null;
	resultPending = true;
	switchTask("review");
	try {
		const result = await request(`/jobs/${encodeURIComponent(entry.job.id)}`);
		if (current())
			await receiveJob(result.job, entry.source, authEpoch, version, current);
	} catch (error) {
		if (current()) actionError("review-message", error);
	} finally {
		if (authEpoch === epoch && version === resultSelectionVersion) {
			resultPending = false;
			updateAction();
			await displayDeferredHistoryResult();
		}
	}
}
$("history-person").addEventListener("change", () => {
	renderJobHistory();
	const personId = $("history-person").value;
	if (!personId) return;
	if (activeTask === "single" && selected?.personId !== personId)
		void selectCharacter(personId);
	if (
		["turntable", "parts"].includes(activeTask) &&
		$("workstation-person").value !== personId
	) {
		$("workstation-person").value = personId;
		void selectWorkstationPerson();
	}
});
$("refresh-history").addEventListener("click", loadJobHistory);
function connectionReady() {
	return connection?.state === "READY" && connection.expiresAt > Date.now();
}
function generationReady() {
	if ($("generation-provider").value !== "comfyui") return connectionReady();
	const seed = $("generation-seed").value;
	return (
		comfyAvailable &&
		!comfyPending &&
		comfyConnection?.state === "READY" &&
		comfyConnection.protocolVersion === "comfyui-http.v1" &&
		comfyConnection.expiresAt > Date.now() &&
		comfyReadiness?.state === "READY" &&
		comfyWorkflows.some(
			(entry) =>
				entry.id === comfyConnection.toolName &&
				entry.providerModel === `comfyui:${entry.id}`,
		) &&
		(seed === "" ||
			(/^\d+$/.test(seed) &&
				Number.isSafeInteger(Number(seed)) &&
				Number(seed) <= 2 ** 48 - 1))
	);
}
$("generation-provider").addEventListener("change", () => {
	$("comfy-generation-fields").hidden =
		$("generation-provider").value !== "comfyui";
	updateAction();
});
$("generation-seed").addEventListener("input", updateAction);
function batchLocked() {
	return (
		submittedBatchId ||
		(activeBatch && !["COMPLETED", "CANCELLED"].includes(activeBatch.state))
	);
}
function actionError(id, error) {
	const code = errorMessage(error);
	const explanation =
		code === "SELECTION_STALE"
			? "선택 당시의 원본이 변경되었습니다. 해당 선택을 제거하고 상세를 다시 확인하세요. 자동으로 바꾸거나 재전송하지 않습니다."
			: code === "OWNER_DISPATCH_UNCERTAIN"
				? "이미 전송된 요청의 결과가 미확인입니다. 새 UUID나 다른 연결로 재생성할 수 없습니다."
				: code === "EVALUATION_REVISION_CONFLICT"
					? "다른 검토 기록이 저장되었습니다. 메모를 유지한 채 현재 결과와 검토 기록을 다시 확인한 후 저장하세요."
					: code === "NOT_FOUND" && id === "review-message"
						? "결과/검토 HTTP 경로가 아직 연결되지 않았거나 이 결과에 접근할 수 없습니다. 저장 완료로 처리하지 않습니다."
						: code === "CONNECTION_NOT_READY" && id === "comfy-status"
							? "ComfyUI 준비 상태를 확인하지 못했습니다 (서버 응답 없음, 워크플로·모델 미설치 또는 세션 만료). 생성 요청은 보내지 않았습니다."
							: "요청을 완료하지 못했습니다. 상태 확인 후 명시적으로 다시 작업하세요.";
	notice(id, `${explanation} (${code})`, true);
	$(id).focus();
}
function renderConnection(preserveError = false) {
	$("disconnect").disabled =
		!connection || connection.state === "REVOKED" || connectionPending;
	$("connect").disabled =
		!session ||
		session.serverProviderConfigured === true ||
		connectionPending ||
		ownerBlocked ||
		Boolean(batchLocked()) ||
		(connection && connection.state !== "REVOKED") ||
		!(session?.mode === "local" || session?.mode === "personal"
			? $("provider-url").value
			: $("endpoint").value);
	$("endpoint").disabled =
		connectionPending ||
		Boolean(connection && connection.state !== "REVOKED") ||
		ownerBlocked ||
		Boolean(batchLocked());
	$("bridge-bearer").disabled = $("endpoint").disabled;
	$("provider-url").disabled = $("endpoint").disabled;
	$("refresh-connection").disabled = connectionPending;
	$("connection-details").replaceChildren(
		connection ? renderValue(connection) : text("p", "연결 ID 없음"),
	);
	if (!preserveError || $("connection-status").getAttribute("role") !== "alert")
		notice(
			"connection-status",
			connection
				? `내 연결: ${connection.state} / ${connection.endpointId}${connectionReady() ? " / 생성 가능" : " / 생성 불가"}`
				: session?.serverProviderConfigured === true
					? "서버에 설정된 내 provider 연결을 확인하세요. 연결 해제 후에는 새 개인 세션이 필요합니다."
					: session?.mode === "local" || session?.mode === "personal"
						? "연결이 없습니다. 내 provider URL과 키를 입력하고 명시적으로 연결하세요."
						: "내 MCP 연결이 없습니다. 검토된 endpoint를 선택하여 명시적으로 연결하세요.",
		);
	renderComfyConnection(preserveError);
	renderNativeConnection(preserveError);
	updateAction();
}
function comfyReady() {
	return (
		comfyConnection?.state === "READY" && comfyConnection.expiresAt > Date.now()
	);
}
function renderComfyConnection(preserveError = false) {
	const canvasLink = $("comfy-canvas-link");
	canvasLink.hidden = !session || !comfyAvailable || !comfyCanvasUrl;
	if (canvasLink.hidden) canvasLink.removeAttribute("href");
	else canvasLink.href = comfyCanvasUrl;
	$("comfy-connection-panel").hidden = !session || !comfyAvailable;
	const select = $("comfy-workflow");
	const previous =
		comfyConnection && comfyConnection.state !== "REVOKED"
			? comfyConnection.toolName
			: select.value;
	if (comfyWorkflows.length) {
		select.replaceChildren(
			...comfyWorkflows.map((workflow) => {
				const option = text("option", `${workflow.label} · ${workflow.id}`);
				option.value = workflow.id;
				return option;
			}),
		);
		select.value = comfyWorkflows.some((workflow) => workflow.id === previous)
			? previous
			: comfyWorkflows[0].id;
	} else {
		const placeholder = text(
			"option",
			comfyAvailable
				? "서버 워크플로를 확인하세요"
				: "이 작업대에는 ComfyUI가 설정되지 않았습니다",
		);
		placeholder.value = "";
		select.replaceChildren(placeholder);
	}
	const workflow =
		comfyWorkflows.find((entry) => entry.id === select.value) ?? null;
	$("comfy-workflow-limits").textContent = workflow?.limitations ?? "";
	const live = Boolean(comfyConnection && comfyConnection.state !== "REVOKED");
	select.disabled =
		comfyPending || live || ownerBlocked || Boolean(batchLocked());
	$("comfy-connect").disabled =
		!session ||
		!comfyAvailable ||
		!workflow ||
		comfyPending ||
		live ||
		ownerBlocked ||
		Boolean(batchLocked());
	$("comfy-disconnect").disabled = !live || comfyPending;
	$("comfy-details").replaceChildren(
		comfyConnection
			? renderValue({ connection: comfyConnection, readiness: comfyReadiness })
			: text("p", "ComfyUI 연결 ID 없음"),
	);
	if (!preserveError || $("comfy-status").getAttribute("role") !== "alert")
		notice(
			"comfy-status",
			comfyConnection
				? `ComfyUI 연결: ${comfyConnection.state} / ${comfyConnection.toolName}${comfyReady() ? " / 텍스트 초안 생성 가능" : " / 생성 불가"}${comfyReadiness?.models ? ` / 설치 모델 ${Object.values(comfyReadiness.models).join(", ")}` : ""}`
				: comfyAvailable
					? "ComfyUI 연결이 없습니다. 연결 확인은 준비 상태만 검사하며 이미지를 생성하지 않습니다."
					: "이 작업대에는 ComfyUI가 설정되지 않았습니다.",
		);
}
$("comfy-workflow").addEventListener("change", () => {
	renderComfyConnection(true);
	updateAction();
});
$("comfy-connect").addEventListener("click", async () => {
	if ($("comfy-connect").disabled || !session) return;
	const workflowId = $("comfy-workflow").value;
	if (!comfyWorkflows.some((workflow) => workflow.id === workflowId)) return;
	const authEpoch = epoch;
	comfyPending = true;
	renderComfyConnection();
	try {
		// Readiness verification only; the server never submits a prompt here.
		const result = await request("/connections", {
			method: "POST",
			body: JSON.stringify({ provider: "comfyui", workflow: workflowId }),
		});
		if (authEpoch !== epoch) return;
		if (!result.connection?.connectionId || result.connection.state !== "READY" || result.connection.protocolVersion !== "comfyui-http.v1" || result.connection.toolName !== workflowId || result.readiness?.state !== "READY")
			throw new Error("UNKNOWN_CONNECTION_RESPONSE");
		comfyConnection = result.connection;
		comfyReadiness = result.readiness ?? null;
	} catch (error) {
		if (authEpoch === epoch) actionError("comfy-status", error);
	} finally {
		if (authEpoch === epoch) {
			comfyPending = false;
			renderComfyConnection(true);
			updateAction();
		}
	}
});
$("comfy-disconnect").addEventListener("click", async () => {
	if ($("comfy-disconnect").disabled || !comfyConnection) return;
	const authEpoch = epoch;
	const id = comfyConnection.connectionId;
	comfyPending = true;
	renderComfyConnection();
	try {
		const result = await request(`/connections/${encodeURIComponent(id)}`, {
			method: "DELETE",
		});
		if (authEpoch === epoch) {
			comfyConnection = result.connection;
			comfyReadiness = null;
		}
	} catch (error) {
		if (authEpoch === epoch) actionError("comfy-status", error);
	} finally {
		if (authEpoch === epoch) {
			comfyPending = false;
			renderComfyConnection(true);
			updateAction();
		}
	}
});
async function loadConnections() {
	if (!session || connectionPending) return;
	const authEpoch = epoch;
	connectionPending = true;
	renderConnection();
	try {
		const result = await request("/connections");
		if (authEpoch !== epoch) return;
		if (
			!Array.isArray(result.endpoints) ||
			result.endpoints.some(
				(endpoint) => typeof endpoint.endpointId !== "string",
			)
		)
			throw new Error("UNKNOWN_CONNECTION_RESPONSE");
		const placeholder = text(
			"option",
			result.endpoints.length
				? "검토된 endpoint를 선택하세요"
				: "등록된 endpoint가 없습니다",
		);
		placeholder.value = "";
		$("endpoint").replaceChildren(placeholder);
		for (const endpoint of result.endpoints) {
			const option = text(
				"option",
				`${endpoint.endpointId} / ${endpoint.toolName} / ${endpoint.revision}`,
			);
			option.value = endpoint.endpointId;
			$("endpoint").append(option);
		}
		connection = result.connection;
		if (connection) $("endpoint").value = connection.endpointId;
		connectionProvider =
			result.provider && typeof result.provider === "object"
				? result.provider
				: null;
		const comfy = result.comfyui;
		comfyAvailable = comfy?.available === true;
		comfyCanvasUrl = comfyAvailable && typeof comfy.canvasUrl === "string" ? comfy.canvasUrl : null;
		comfyWorkflows =
			comfyAvailable && Array.isArray(comfy.workflows)
				? comfy.workflows.filter(
						(workflow) =>
							typeof workflow?.id === "string" &&
							typeof workflow?.providerModel === "string",
					)
				: [];
		comfyConnection = comfyAvailable ? (comfy.connection ?? null) : null;
		comfyReadiness = comfyAvailable ? (comfy.readiness ?? null) : null;
		const native = result.capabilities?.nativeMoss;
		try {
			nativeCapability =
				native === undefined ? null : readNativeCapability(native);
			nativeCapabilityReason = "NATIVE_CAPABILITY_ABSENT";
		} catch {
			nativeCapability = null;
			nativeCapabilityReason = "NATIVE_CAPABILITY_INVALID";
		}
	} catch (error) {
		if (authEpoch === epoch) {
			connection = null;
			connectionProvider = null;
			comfyConnection = null;
			comfyReadiness = null;
			nativeCapability = null;
			nativeCapabilityReason = errorMessage(error);
			actionError("connection-status", error);
		}
	} finally {
		if (authEpoch === epoch) {
			connectionPending = false;
			renderConnection(true);
		}
	}
}
$("endpoint").addEventListener("change", renderConnection);
$("provider-url").addEventListener("input", renderConnection);
$("refresh-connection").addEventListener("click", loadConnections);
async function loadAccountProvider() {
	const authEpoch = epoch;
	const result = await request("/connections/account");
	if (authEpoch !== epoch) return;
	$("account-provider-model").replaceChildren(
		...result.models.map((model) => {
			const option = text("option", model.label);
			option.value = model.id;
			return option;
		}),
	);
	if (result.model) $("account-provider-model").value = result.model;
	$("account-provider-url").value = result.baseUrl ?? "";
	$("account-provider-disconnect").disabled = !result.connected;
	session.accountProviderConnected = result.connected;
	notice(
		"account-provider-status",
		result.connected
			? `연결됨: ${result.baseUrl} / ${result.models.find((model) => model.id === result.model)?.label ?? result.model}`
			: "계정에 저장된 프로바이더 연결이 없습니다.",
	);
}
async function saveAccountProvider(method) {
	if (!session || connectionPending) return;
	const authEpoch = epoch;
	const body =
		method === "POST"
			? JSON.stringify({
					baseUrl: $("account-provider-url").value,
					apiKey: $("account-provider-key").value,
					model: $("account-provider-model").value,
				})
			: undefined;
	$("account-provider-key").value = "";
	connectionPending = true;
	$("account-provider-connect").disabled = true;
	$("account-provider-disconnect").disabled = true;
	try {
		await request("/connections/account", { method, body });
		if (authEpoch !== epoch) return;
		await loadAccountProvider();
	} catch (error) {
		if (authEpoch === epoch) actionError("account-provider-status", error);
	} finally {
		if (authEpoch === epoch) {
			connectionPending = false;
			$("account-provider-connect").disabled = false;
			$("account-provider-disconnect").disabled =
				!session.accountProviderConnected;
			await loadConnections();
		}
	}
}
$("account-provider-form").addEventListener("submit", (event) => {
	event.preventDefault();
	void saveAccountProvider("POST");
});
$("account-provider-disconnect").addEventListener("click", () => {
	void saveAccountProvider("DELETE");
});
$("connection-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	if ($("connect").disabled || !session) return;
	const authEpoch = epoch;
	const body = JSON.stringify(
		session.mode === "local" || session.mode === "personal"
			? {
					baseUrl: $("provider-url").value,
					apiKey: $("bridge-bearer").value,
				}
			: {
					endpointId: $("endpoint").value,
					bridgeBearer: $("bridge-bearer").value,
				},
	);
	$("bridge-bearer").value = "";
	connectionPending = true;
	renderConnection();
	try {
		const result = await request("/connections", { method: "POST", body });
		if (authEpoch !== epoch) return;
		if (!result.connection?.connectionId)
			throw new Error("UNKNOWN_CONNECTION_RESPONSE");
		connection = result.connection;
	} catch (error) {
		if (authEpoch === epoch) actionError("connection-status", error);
	} finally {
		if (authEpoch === epoch) {
			connectionPending = false;
			renderConnection(true);
		}
	}
});
$("disconnect").addEventListener("click", async () => {
	if ($("disconnect").disabled) return;
	const authEpoch = epoch;
	const id = connection.connectionId;
	connectionPending = true;
	$("bridge-bearer").value = "";
	renderConnection();
	try {
		const result = await request(`/connections/${encodeURIComponent(id)}`, {
			method: "DELETE",
		});
		if (authEpoch === epoch) connection = result.connection;
	} catch (error) {
		if (authEpoch === epoch) actionError("connection-status", error);
	} finally {
		if (authEpoch === epoch) {
			connectionPending = false;
			renderConnection(true);
		}
	}
});
function immutableSelection(source) {
	const hashes = source.generationEligibility?.originalSourceHashes;
	if (
		!source.generationEligibility?.eligible ||
		!shaPattern.test(source.source?.sha256) ||
		!hashes ||
		["detail", "token"].some((key) => !shaPattern.test(hashes[key])) ||
		(hashes.image === null
			? source.generationEligibility.sourceMode !== "design-token-only"
			: !shaPattern.test(hashes.image))
	)
		throw new Error(
			source.generationEligibility?.reason ?? "INVALID_SELECTION_HASHES",
		);
	return Object.freeze({
		personId: source.personId,
		characterId: source.characterId,
		name: source.name,
		wikiDetailSHA: source.source.sha256,
		...(source.generationEligibility.sourceMode
			? { sourceMode: source.generationEligibility.sourceMode }
			: {}),
		originalSourceHashes: Object.freeze({
			detail: hashes.detail,
			token: hashes.token,
			image: hashes.image,
		}),
	});
}
function renderWikiBatchOptions(people) {
	$("wiki-batch-list").replaceChildren();
	for (const person of people) {
		const label = document.createElement("label");
		label.className = "check-label";
		const check = document.createElement("input");
		check.type = "checkbox";
		check.dataset.personId = person.personId;
		check.checked =
			batchSelection.has(person.personId) ||
			selectionLoads.has(person.personId);
		check.disabled =
			person.generationEligibility?.eligible !== true ||
			selectionLoads.has(person.personId);
		label.append(
			check,
			text(
				"span",
				`${person.name} / ${person.characterId} / ${person.personId}${check.disabled ? ` · ${person.generationEligibility?.reason ?? "참조 미확인"}` : ""}`,
			),
		);
		check.addEventListener("change", () =>
			toggleBatchSelection(person.personId, check),
		);
		$("wiki-batch-list").append(label);
	}
}
async function toggleBatchSelection(personId, check) {
	if (!check.checked) {
		batchSelection.delete(personId);
		renderBatchSelection();
		return;
	}
	if (batchSelection.has(personId) || selectionLoads.has(personId)) return;
	if (batchSelection.size + selectionPending >= 20) {
		check.checked = false;
		actionError("batch-message", new Error("MAXIMUM_20_PEOPLE"));
		return;
	}
	const authEpoch = epoch;
	selectionLoads.add(personId);
	selectionPending += 1;
	$("batch-reviewed").checked = false;
	check.disabled = true;
	updateBatchAction();
	try {
		const source = await request(
			`/wiki/people/${encodeURIComponent(personId)}`,
		);
		if (authEpoch !== epoch) return;
		if (source.personId !== personId) throw new Error("UNKNOWN_WIKI_DETAIL");
		batchSelection.set(personId, immutableSelection(source));
		renderBatchSelection();
	} catch (error) {
		if (authEpoch === epoch) {
			check.checked = false;
			actionError("batch-message", error);
		}
	} finally {
		if (authEpoch === epoch) {
			selectionLoads.delete(personId);
			selectionPending -= 1;
			check.disabled = false;
			for (const current of $("wiki-batch-list").querySelectorAll("input")) {
				if (current.dataset.personId === personId) {
					current.checked = batchSelection.has(personId);
					current.disabled = false;
				}
			}
			updateBatchAction();
		}
	}
}
function renderBatchSelection() {
	$("batch-reviewed").checked = false;
	$("batch-selection-count").textContent =
		`선택 ${batchSelection.size} / 최대 20명`;
	$("batch-selection-list").replaceChildren();
	for (const item of batchSelection.values()) {
		const li = document.createElement("li");
		li.append(
			text("p", `${item.name} / ${item.characterId} / ${item.personId}`),
		);
		const details = document.createElement("details");
		details.append(
			text("summary", "선택 당시의 불변 SHA 확인"),
			renderValue(item),
		);
		const remove = text("button", `${item.name} 선택 제거`);
		remove.type = "button";
		remove.addEventListener("click", () => {
			batchSelection.delete(item.personId);
			for (const check of $("wiki-batch-list").querySelectorAll("input"))
				if (check.dataset.personId === item.personId) check.checked = false;
			renderBatchSelection();
		});
		li.append(details, remove);
		$("batch-selection-list").append(li);
	}
	updateBatchAction();
}
function updateBatchAction() {
	$("generate-batch").disabled =
		!session ||
		workstationPending ||
		!connectionReady() ||
		connectionPending ||
		ownerBlocked ||
		Boolean(batchLocked()) ||
		batchPending ||
		pending ||
		uploadPending ||
		selectionPending > 0 ||
		batchSelection.size < 1 ||
		batchSelection.size > 20 ||
		!$("batch-reviewed").checked ||
		Boolean(activeJob && !["HOLD", "FAILED"].includes(activeJob.state));
	$("batch-disabled-reason").textContent = !session
		? "로그인이 필요합니다."
		: !connectionReady() || connectionPending
			? "내 READY 연결이 필요합니다."
			: ownerBlocked ||
					batchLocked() ||
					batchPending ||
					pending ||
					uploadPending ||
					(activeJob && !["HOLD", "FAILED"].includes(activeJob.state))
				? "진행 중 또는 미확인 작업을 먼저 확인하세요."
				: selectionPending > 0
					? `원본 확인 중 ${selectionPending}명 / 선택 ${batchSelection.size + selectionPending} / 최대 20명`
					: batchSelection.size < 1
						? "적격 인물을 1~20명 선택하세요."
						: !$("batch-reviewed").checked
							? "선택한 이름과 인원수를 확인하세요."
							: "선택한 인물을 한 번 요청합니다.";
	$("refresh-batch").disabled =
		batchPending || (!activeBatch && !submittedBatchId);
	$("cancel-batch").disabled =
		batchPending ||
		!activeBatch ||
		["COMPLETED", "CANCELLED"].includes(activeBatch.state) ||
		activeBatch.cancelRequested;
}
$("batch-reviewed").addEventListener("change", updateBatchAction);
function receiveBatch(batch) {
	if (
		!batch ||
		typeof batch.batchId !== "string" ||
		!Array.isArray(batch.items) ||
		batch.items.some((item, ordinal) => item.ordinal !== ordinal)
	)
		throw new Error("UNKNOWN_BATCH_RESPONSE");
	activeBatch = batch;
	submittedBatchId = null;
	renderResultStrip();
	batchSummaries.clear();
	if (
		batch.items.some((item) => item.status === "UNKNOWN") ||
		batch.state === "PAUSED_UNKNOWN"
	)
		ownerBlocked = true;
	$("batch-view").replaceChildren(
		text("strong", batch.state, "verdict"),
		text("p", `서버 접수 확인 / 일괄 ID: ${batch.batchId}`, "meta"),
		text(
			"p",
			`연결: ${batch.connectionId} / revision ${batch.connectionRevision}`,
			"meta",
		),
	);
	if (batch.pauseReason)
		$("batch-view").append(text("p", `중지 사유: ${batch.pauseReason}`));
	const { progress } = batch;
	if (progress) {
		const counts = text(
			"p",
			`확정 ${progress.settled} / 전체 ${progress.total} · 후보 완료 ${progress.hold} · 실행 실패 ${progress.failed} · 취소 ${progress.cancelled} · 실행 중 ${progress.running} · 미확인 ${progress.unknown} · 대기 ${progress.pending}`,
		);
		counts.id = "batch-progress";
		for (const key of ["settled", "total", "unknown", "pending", "running"])
			counts.dataset[key] = String(progress[key]);
		$("batch-view").append(counts);
	}
	if (batch.items.some((item) => item.status === "UNKNOWN"))
		$("batch-view").append(
			text(
				"p",
				"UNKNOWN은 확정 완료가 아닙니다. 서버가 후속 항목을 중지했습니다. 상태 조회만 가능하며 자동 재생성하지 않습니다.",
			),
		);
	const list = document.createElement("ol");
	for (const item of batch.items) {
		const li = document.createElement("li");
		li.className = "batch-item";
		li.dataset.ordinal = String(item.ordinal);
		li.dataset.status = item.status;
		li.append(
			text("h3", `${item.ordinal + 1}. ${item.name} / ${item.characterId}`),
			text(
				"p",
				`실행: ${item.status === "HOLD" ? "COMPLETE / 후보 HOLD" : item.status}`,
				"verdict",
			),
			text("p", `작업 ID: ${item.jobId ?? "미실행"}`, "meta"),
			text("p", `요청 ID: ${item.requestId}`, "meta"),
		);
		if (item.errorCode) li.append(text("p", item.errorCode));
		const summary = text(
			"p",
			item.status === "HOLD"
				? "사람의 검토: 결과 결속과 최신 기록 확인 중"
				: "사람의 검토: 결과 없음 / 확인 불가",
			"meta",
		);
		summary.setAttribute("role", "status");
		li.append(summary);
		const entry = { node: summary, token: null, item, batchId: batch.batchId };
		batchSummaries.set(item.itemId, entry);
		if (item.status === "HOLD" && item.jobId) refreshBatchSummary(batch, entry);
		const button = text("button", `${item.name} 결과 확인`);
		button.type = "button";
		button.disabled = item.status !== "HOLD" || !item.jobId;
		button.addEventListener("click", () =>
			selectBatchResult(item, batch.batchId, true),
		);
		li.append(button);
		list.append(li);
	}
	$("batch-view").append(list);
	$("refresh-batch").hidden = false;
	$("cancel-batch").hidden = false;
	updateAction();
	renderConnection();
}
$("generate-batch").addEventListener("click", async () => {
	if ($("generate-batch").disabled) return;
	if (!guardDraftNavigation(() => $("generate-batch").click())) return;
	const authEpoch = epoch;
	const version = ++batchVersion;
	const payload = {
		batchId: crypto.randomUUID(),
		connectionId: connection.connectionId,
		providerModel: model,
		faceMode: { kind: "unique", variantId: null },
		items: [...batchSelection.values()],
	};
	batchPending = true;
	activeBatch = null;
	submittedBatchId = payload.batchId;
	$("refresh-batch").hidden = false;
	$("cancel-batch").hidden = true;
	notice(
		"batch-message",
		`일괄 ${payload.batchId}를 한 번 요청합니다. 응답 유실 시 이 ID로 상태만 확인하세요.`,
	);
	$("batch-view").replaceChildren(
		text("p", `접수 결과 미확인 / 일괄 ID: ${payload.batchId}`),
	);
	updateAction();
	try {
		const result = await request("/batches", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (authEpoch !== epoch || version !== batchVersion) return;
		receiveBatch(result.batch);
		switchTask("queue");
		notice(
			"batch-message",
			"서버가 선택 순서대로 접수했습니다. 완료 상태는 일괄 상태 확인 버튼으로 조회하세요.",
		);
	} catch (error) {
		if (authEpoch === epoch && version === batchVersion) {
			if (
				error.status &&
				error.status < 500 &&
				errorMessage(error) !== "OWNER_DISPATCH_UNCERTAIN"
			)
				submittedBatchId = null;
			if (submittedBatchId)
				notice(
					"batch-message",
					`제출 결과 미확인: ${submittedBatchId}. 접수된 작업으로 판단하지 않습니다. 상태만 확인하세요. 자동 재전송하지 않습니다.`,
					true,
				);
			else actionError("batch-message", error);
		}
	} finally {
		if (authEpoch === epoch) {
			batchPending = false;
			updateAction();
		}
	}
});
async function batchAction(cancel = false) {
	if ((!activeBatch && !submittedBatchId) || !session || batchPending) return;
	if (cancel && (!activeBatch || $("cancel-batch").disabled)) return;
	const authEpoch = epoch;
	const version = ++batchVersion;
	const batchId = submittedBatchId ?? activeBatch.batchId;
	batchPending = true;
	updateAction();
	try {
		const result = await request(
			`/batches/${encodeURIComponent(batchId)}${cancel ? "/cancel-pending" : ""}`,
			cancel ? { method: "POST", body: "{}" } : {},
		);
		if (authEpoch !== epoch || version !== batchVersion) return;
		receiveBatch(result.batch);
		switchTask("queue");
		notice(
			"batch-message",
			cancel
				? `미실행 취소 ${result.batch.progress.cancelled}건. 이미 실행 중이거나 미확인인 요청은 취소했다고 판단하지 않습니다.`
				: "서버의 현재 상태를 확인했습니다. 생성 요청은 보내지 않았습니다.",
		);
	} catch (error) {
		if (authEpoch === epoch) actionError("batch-message", error);
	} finally {
		if (authEpoch === epoch) {
			batchPending = false;
			updateAction();
		}
	}
}
$("refresh-batch").addEventListener("click", () => batchAction());
$("cancel-batch").addEventListener("click", () => batchAction(true));
async function selectBatchResult(item, batchId, openReview = false) {
	if (
		!session ||
		pending ||
		(activeBatch?.batchId !== batchId && !knownResults.has(item.jobId))
	)
		return;
	if (activeJob?.id === item.jobId) {
		if (openReview) switchTask("review");
		return;
	}
	const destination = { ...item };
	if (
		!guardDraftNavigation(() =>
			selectBatchResult(destination, batchId, openReview),
		)
	)
		return;
	const authEpoch = epoch;
	const version = ++resultSelectionVersion;
	const current = () =>
		authEpoch === epoch && version === resultSelectionVersion;
	activeJob = null;
	clearReview();
	if (openReview) switchTask("review");
	resultPending = true;
	clearPreview();
	$("sheet-view").replaceChildren(
		text(
			"p",
			`검토 대상: ${item.name} / ${item.characterId}. 생성 초안 선택과 별개의 결과입니다.`,
		),
	);
	notice("selection-message", `결과 작업 ${item.jobId} / ${item.name}`);
	updateAction();
	try {
		const result = await request(`/jobs/${encodeURIComponent(item.jobId)}`);
		if (!current()) return;
		if (result.job?.id !== item.jobId || result.job.state !== "HOLD")
			throw new Error("RESULT_NOT_AVAILABLE");
		await receiveJob(
			result.job,
			{
				name: item.name,
				characterId: item.characterId,
				batchId,
				itemId: item.itemId,
				requestId: item.requestId,
				snapshotSHA: item.snapshotSHA,
			},
			authEpoch,
			version,
			current,
		);
	} catch (error) {
		if (current()) actionError("review-message", error);
	} finally {
		if (current()) {
			resultPending = false;
			updateAction();
			await displayDeferredHistoryResult();
		}
	}
}
function clearReview() {
	clearComparison();
	captureDraft();
	reviewDraft = null;
	resultVersion += 1;
	reviewBinding = null;
	reviewRevision = 0;
	$("alpha-result").replaceChildren();
	$("alpha-message").textContent =
		"봉인 결과를 선택하세요. 파생본 HOLD · 승인 NONE";
	reviewPending = false;
	$("evaluation-form").reset();
	$("evaluation-fields").disabled = true;
	$("result-binding").replaceChildren();
	$("evaluation-history").replaceChildren(text("p", "확인한 기록이 없습니다."));
	notice(
		"review-message",
		"선택한 HOLD 결과 PNG의 SHA를 확인한 후 검토할 수 있습니다.",
	);
	updateOverall();
	updateDraftActions();
}
function clearComparison() {
	comparisonVersion += 1;
	sourcePending = false;
	for (const url of [
		comparisonResultUrl,
		comparisonSourceUrl,
		comparisonNormalizedUrl,
	])
		if (url) URL.revokeObjectURL(url);
	comparisonResultUrl = null;
	comparisonSourceUrl = null;
	comparisonNormalizedUrl = null;
	for (const id of [
		"source-image",
		"normalized-image",
		"result-image",
		"overlay-source",
		"overlay-result",
	]) {
		$(id).hidden = true;
		$(id).removeAttribute("src");
		delete $(id).dataset.sha;
		delete $(id).dataset.jobId;
	}
	comparisonMode = "result";
	comparisonOpacity = 50;
	comparisonSourceSize = null;
	comparisonResultSize = null;
	$("result-opacity").value = "50";
	$("overlay-caption").textContent = "";
	renderComparison();
}
function renderComparison() {
	const available = Boolean(comparisonResultUrl);
	if (!comparisonSourceUrl) comparisonMode = "result";
	$("comparison-images").hidden = !available;
	$("comparison-images").dataset.mode = comparisonMode;
	$("source-figure").hidden =
		!comparisonSourceUrl ||
		comparisonMode === "normalized" ||
		comparisonMode === "result" ||
		comparisonMode === "overlay";
	$("result-figure").hidden =
		!available ||
		comparisonMode === "original" ||
		comparisonMode === "normalized" ||
		comparisonMode === "overlay";
	$("normalized-figure").hidden =
		!comparisonNormalizedUrl ||
		!["normalized", "side-by-side"].includes(comparisonMode);
	const overlay = comparisonMode === "overlay" && Boolean(comparisonSourceUrl);
	$("overlay-view").hidden = !overlay;
	$("overlay-controls").hidden = !overlay;
	$("result-opacity").disabled = !overlay;
	$("result-opacity-value").textContent = `${comparisonOpacity}%`;
	if (comparisonSourceSize && comparisonResultSize) {
		const [sw, sh] = comparisonSourceSize;
		const [rw, rh] = comparisonResultSize;
		const width = Math.max(sw, rw);
		const height = Math.max(sh, rh);
		$("overlay-stage").setAttribute(
			"style",
			`aspect-ratio: ${width} / ${height}; inline-size: min(100%, calc(min(65dvh, 560px) * ${width / height}))`,
		);
		$("overlay-source").setAttribute(
			"style",
			`width: ${(100 * sw) / width}%; height: ${(100 * sh) / height}%`,
		);
		$("overlay-result").setAttribute(
			"style",
			`width: ${(100 * rw) / width}%; height: ${(100 * rh) / height}%; opacity: ${comparisonOpacity / 100}`,
		);
		$("overlay-caption").textContent =
			`작업 ${reviewBinding?.jobId} · 원본 ${sw}×${sh} px / SHA ${$("source-image").dataset.sha} · 결과 ${rw}×${rh} px / SHA ${$("result-image").dataset.sha} · ${sw !== rw || sh !== rh ? "크기 불일치 · " : ""}공통 원점 (0,0), 동일 배율의 좌표 비교입니다. 정렬·동일성 또는 승인의 증거가 아닙니다.`;
	}
	$("retry-source").hidden = !available || Boolean(comparisonSourceUrl);
	$("retry-source").disabled = sourcePending;
	for (const mode of [
		"result",
		"original",
		"normalized",
		"side-by-side",
		"overlay",
	]) {
		const button = $(`compare-${mode}`);
		button.disabled =
			mode === "result"
				? !available
				: mode === "normalized"
					? !comparisonNormalizedUrl
					: !comparisonSourceUrl;
		button.setAttribute("aria-pressed", String(comparisonMode === mode));
	}
}
for (const mode of [
	"result",
	"original",
	"normalized",
	"side-by-side",
	"overlay",
])
	$(`compare-${mode}`).addEventListener("click", () => {
		comparisonMode = mode;
		renderComparison();
	});
$("result-opacity").addEventListener("input", () => {
	comparisonOpacity = Number($("result-opacity").value);
	renderComparison();
});
function renderResultStrip() {
	$("review-results").replaceChildren();
	const entries = new Map(knownResults);
	for (const item of activeBatch?.items ?? [])
		if (item.jobId && !entries.has(item.jobId))
			entries.set(item.jobId, { ...item, batchId: activeBatch.batchId });
	for (const [jobId, item] of entries) {
		const button = text("button", `${item.name ?? "이름 미확인"} / ${jobId}`);
		button.type = "button";
		button.dataset.resultId = jobId;
		button.setAttribute("data-result-id", jobId);
		button.setAttribute("aria-pressed", String(reviewBinding?.jobId === jobId));
		button.disabled = item.status && item.status !== "HOLD";
		button.addEventListener("click", () =>
			selectBatchResult({ ...item, jobId }, item.batchId),
		);
		$("review-results").append(button);
	}
	if (!entries.size)
		$("review-results").append(
			text("p", "이번 세션에서 확인한 결과가 없습니다.", "meta"),
		);
}
async function decodedImageUrl(blob, current) {
	const url = URL.createObjectURL(blob);
	try {
		const image = document.createElement("img");
		image.src = url;
		await image.decode();
		if (!current()) {
			URL.revokeObjectURL(url);
			return null;
		}
		return { url, size: [image.naturalWidth, image.naturalHeight] };
	} catch {
		URL.revokeObjectURL(url);
		throw new Error("IMAGE_DECODE_FAILED");
	}
}
async function loadCapturedSource() {
	if (!reviewBinding || !comparisonResultUrl || sourcePending) return;
	const binding = reviewBinding;
	const version = ++comparisonVersion;
	const authEpoch = epoch;
	const current = () =>
		authEpoch === epoch &&
		version === comparisonVersion &&
		reviewBinding === binding;
	sourcePending = true;
	if (comparisonSourceUrl) URL.revokeObjectURL(comparisonSourceUrl);
	comparisonSourceUrl = null;
	comparisonSourceSize = null;
	for (const id of ["source-image", "overlay-source"]) {
		$(id).hidden = true;
		$(id).removeAttribute("src");
		delete $(id).dataset.jobId;
		delete $(id).dataset.sha;
	}
	renderComparison();
	notice("comparison-message", "생성 당시 캡처 원본을 검증하고 있습니다.");
	try {
		const { source } = await request(
			`/jobs/${encodeURIComponent(binding.jobId)}/captured-source`,
		);
		if (!current()) return;
		if (
			source?.schema !== "portal-captured-source.v1" ||
			!["ownerId", "jobId", "batchId", "itemId", "snapshotSHA"].every(
				(key) => source[key] === binding[key],
			) ||
			!source.identity ||
			!["personId", "characterId", "name"].every(
				(key) =>
					typeof source.identity[key] === "string" &&
					source.identity[key].length > 0,
			)
		)
			throw new Error("SOURCE_BINDING_MISMATCH");
		if (source.imageBase64 === null && source.imageSHA === null) {
			const known = knownResults.get(binding.jobId);
			if (known) Object.assign(known, source.identity);
			renderResultStrip();
			notice(
				"comparison-message",
				"디자인 토큰으로 생성한 결과입니다. 비교할 원본 사진은 없습니다.",
			);
			return;
		}
		if (
			typeof source.imageBase64 !== "string" ||
			source.imageBase64.length > 12 * 1024 * 1024 ||
			!shaPattern.test(source.imageSHA)
		)
			throw new Error("SOURCE_IMAGE_INVALID");
		const raw = atob(source.imageBase64);
		if (!raw.length || btoa(raw) !== source.imageBase64)
			throw new Error("SOURCE_IMAGE_INVALID");
		const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
		const digest = [
			...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
		]
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");
		if (digest !== source.imageSHA) throw new Error("SOURCE_HASH_MISMATCH");
		const decoded = await decodedImageUrl(
			new Blob([bytes], { type: "image/png" }),
			current,
		);
		if (!decoded || !current()) return;
		const { url, size } = decoded;
		comparisonSourceUrl = url;
		comparisonSourceSize = size;
		$("overlay-source").src = url;
		$("overlay-source").hidden = false;
		$("overlay-source").dataset.jobId = binding.jobId;
		$("source-image").src = url;
		$("source-image").hidden = false;
		$("source-image").dataset.sha = digest;
		$("source-image").dataset.jobId = binding.jobId;
		$("source-caption").textContent =
			`${source.identity.name} / 캡처 원본 / ${size[0]}×${size[1]} px / SHA ${digest}`;
		if (source.normalizedImageBase64 && shaPattern.test(source.normalizedSHA)) {
			const normalized = Uint8Array.from(
				atob(source.normalizedImageBase64),
				(char) => char.charCodeAt(0),
			);
			const normalizedSHA = [
				...new Uint8Array(await crypto.subtle.digest("SHA-256", normalized)),
			]
				.map((byte) => byte.toString(16).padStart(2, "0"))
				.join("");
			if (normalizedSHA !== source.normalizedSHA)
				throw new Error("SOURCE_HASH_MISMATCH");
			const decodedNormalized = await decodedImageUrl(
				new Blob([normalized], { type: "image/png" }),
				current,
			);
			if (!decodedNormalized || !current()) return;
			if (comparisonNormalizedUrl) URL.revokeObjectURL(comparisonNormalizedUrl);
			comparisonNormalizedUrl = decodedNormalized.url;
			$("normalized-image").src = comparisonNormalizedUrl;
			$("normalized-image").hidden = false;
			$("normalized-caption").textContent =
				`${source.identity.name} / 정규화 340×510 · contain · SHA ${normalizedSHA}`;
		}
		const known = knownResults.get(binding.jobId);
		if (known) Object.assign(known, source.identity);
		renderResultStrip();
		notice(
			"comparison-message",
			`캡처 원본 결속 및 SHA 확인 완료: ${binding.jobId}`,
		);
	} catch (error) {
		if (current())
			notice(
				"comparison-message",
				`원본 비교 불가: ${errorMessage(error)}. 검증된 결과 검토는 계속할 수 있습니다.`,
				true,
			);
	} finally {
		if (current()) {
			sourcePending = false;
			renderComparison();
		}
	}
}
$("retry-source").addEventListener("click", () => loadCapturedSource());
function categoryValues() {
	return Object.fromEntries(
		reviewCategories.map(([key]) => [
			key,
			{ judgement: $(`category-${key}`).value, notes: $(`notes-${key}`).value },
		]),
	);
}
function editorContent() {
	return {
		categories: categoryValues(),
		notes: $("evaluation-notes").value,
		verdict: updateOverall(),
	};
}
function contentOf(record) {
	return {
		categories: Object.fromEntries(
			reviewCategories.map(([key]) => [
				key,
				{
					judgement: record.categories[key].judgement,
					notes: record.categories[key].notes,
				},
			]),
		),
		notes: record.notes,
		verdict: record.verdict,
	};
}
function sameContent(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}
function sameBinding(a, b) {
	return (
		[
			"ownerId",
			"jobId",
			"batchId",
			"itemId",
			"snapshotSHA",
			"pngSHA",
			"receiptSHA",
		].every((key) => a[key] === b[key]) &&
		JSON.stringify(a.machineEvidence) === JSON.stringify(b.machineEvidence)
	);
}
function captureDraft() {
	if (
		reviewDraft &&
		reviewBinding &&
		sameBinding(reviewDraft.binding, reviewBinding)
	)
		reviewDraft.editable = editorContent();
}
function draftDirty(record = reviewDraft) {
	return record && !sameContent(record.editable, record.baseline);
}
function showDraft(record) {
	for (const [key] of reviewCategories) {
		$(`category-${key}`).value = record.editable.categories[key].judgement;
		$(`notes-${key}`).value = record.editable.categories[key].notes;
	}
	$("evaluation-notes").value = record.editable.notes;
	updateOverall();
	updateNoteCounts();
	updateDraftActions();
}
async function loadAlpha(binding, create = false) {
	const current = () => reviewBinding === binding && Boolean(session);
	$("create-alpha").disabled = true;
	$("alpha-result").replaceChildren();
	try {
		const { derivative } = await request(
			`/jobs/${encodeURIComponent(binding.jobId)}/alpha-derivative`,
			create
				? {
						method: "POST",
						body: JSON.stringify({
							pngSHA: binding.pngSHA,
							receiptSHA: binding.receiptSHA,
							snapshotSHA: binding.snapshotSHA,
							machineMetricsSHA: binding.machineEvidence.metricsSHA,
						}),
					}
				: {},
		);
		if (!current()) return;
		if (!derivative) {
			$("alpha-message").textContent =
				"아직 파생본이 없습니다. 버튼을 누르면 비생성 처리 1회를 수행합니다. 승인 NONE";
			return;
		}
		if (
			derivative.schema !== "portal-alpha-derivative.v1" ||
			derivative.ownerId !== binding.ownerId ||
			derivative.jobId !== binding.jobId ||
			derivative.parent?.pngSHA !== binding.pngSHA ||
			derivative.parent?.receiptSHA !== binding.receiptSHA ||
			derivative.parent?.snapshotSHA !== binding.snapshotSHA ||
			derivative.parent?.machineMetricsSHA !==
				binding.machineEvidence.metricsSHA ||
			derivative.reviewStatus !== "HOLD" ||
			derivative.approval !== "NONE" ||
			derivative.imageUrl !==
				`${binding.imageUrl.replace(/\/image$/, "")}/alpha-derivative/image`
		)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const blob = await request(
			`/jobs/${encodeURIComponent(binding.jobId)}/alpha-derivative/image`,
			{},
			true,
		);
		const digest = [
			...new Uint8Array(
				await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
			),
		]
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");
		if (digest !== derivative.pngSHA) throw Error("RESULT_HASH_MISMATCH");
		const decoded = await decodedImageUrl(blob, current);
		if (!decoded || !current()) return;
		const image = document.createElement("img");
		image.src = decoded.url;
		image.alt = "투명 배경 파생본 · 소유자 검토 전 · 승인 아님";
		image.width = 340;
		image.height = 510;
		image.style.maxWidth = "100%";
		image.style.height = "auto";
		image.addEventListener("load", () => URL.revokeObjectURL(decoded.url), {
			once: true,
		});
		$("alpha-result").append(image, renderValue(derivative));
		$("alpha-message").textContent =
			`파생본 ${derivative.derivativeId} / PNG SHA ${digest} / 별도 영수증 SHA ${derivative.receiptSHA}. 원본 검토와 별개 · 소유자 경계 검토 필요 · HOLD · 승인 NONE`;
	} catch (error) {
		if (current())
			$("alpha-message").textContent =
				`파생본 확인/처리 실패: ${errorMessage(error)}. 원본 유지 · 승인 NONE`;
	} finally {
		if (current()) $("create-alpha").disabled = false;
	}
}
$("create-alpha").addEventListener("click", () => {
	if (!$("create-alpha").disabled && reviewBinding && session)
		void loadAlpha(reviewBinding, true);
});
function updateDraftActions() {
	$("create-alpha").disabled =
		!reviewBinding ||
		(activeJob?.reference?.schemaVersion === 2 &&
			activeJob.reference.inputMode === "reference-img2img");
	$("save-evaluation").disabled =
		!reviewBinding ||
		!reviewDraft?.verified ||
		reviewDraft.evidenceError ||
		Boolean(reviewDraft.attempt);
	$("retry-evaluation").hidden = !reviewDraft?.attempt;
	$("retry-evaluation").disabled =
		!reviewBinding ||
		!reviewDraft?.verified ||
		reviewDraft.evidenceError ||
		reviewDraft.attempt?.state !== "uncertain";
}
function closeDraftDialog() {
	const destination = draftDestination;
	draftDestination = null;
	if ($("dirty-dialog").open) $("dirty-dialog").close();
	destination?.focus?.focus();
}
function guardDraftNavigation(proceed, logout = false) {
	if (draftNavigationPermit) {
		draftNavigationPermit = false;
		return true;
	}
	captureDraft();
	if (
		!draftDirty() &&
		!(
			logout &&
			[...resultDrafts.values()].some(
				(record) => draftDirty(record) || record.attempt,
			)
		)
	)
		return true;
	if (draftDestination) return false;
	draftDestination = {
		proceed,
		logout,
		record: reviewDraft,
		focus: document.activeElement,
		epoch,
	};
	$("draft-keep").hidden = logout;
	$("dirty-description").textContent = logout
		? "초안을 폐기하고 세션을 종료하거나 계속 검토하세요."
		: "현재 결과의 초안을 보존하거나 폐기한 후 이동하세요. 미확인 저장 요청은 폐기하지 않습니다.";
	$("dirty-dialog").showModal();
	$("draft-continue").focus();
	return false;
}
$("draft-continue").addEventListener("click", closeDraftDialog);
$("dirty-dialog").addEventListener("cancel", (event) => {
	event.preventDefault();
	closeDraftDialog();
});
$("dirty-dialog").addEventListener("keydown", (event) => {
	if (event.key !== "Tab") return;
	const buttons = [
		$("draft-continue"),
		$("draft-keep"),
		$("draft-discard"),
	].filter((button) => !button.hidden);
	const index = buttons.indexOf(document.activeElement);
	if (
		(event.shiftKey && index <= 0) ||
		(!event.shiftKey && index === buttons.length - 1)
	) {
		event.preventDefault();
		buttons[event.shiftKey ? buttons.length - 1 : 0].focus();
	}
});
for (const action of ["keep", "discard"])
	$(`draft-${action}`).addEventListener("click", async () => {
		const destination = draftDestination;
		if (!destination || destination.epoch !== epoch) return;
		if (destination.record) {
			if (action === "discard")
				destination.record.editable = structuredClone(
					destination.record.baseline,
				);
			// Detach only the view: sending and uncertain attempts remain owned by the record.
			showDraft(destination.record);
			reviewDraft = null;
		}
		closeDraftDialog();
		draftNavigationPermit = true;
		await destination.proceed();
	});
function updateNoteCounts() {
	for (const [key] of reviewCategories)
		$(`count-${key}`).textContent =
			`${Array.from($(`notes-${key}`).value).length} / 2000`;
	$("evaluation-notes-count").textContent =
		`${Array.from($("evaluation-notes").value).length} / 8000`;
}
function limitNotes(input, limit) {
	input.value = Array.from(input.value).slice(0, limit).join("");
	captureDraft();
	updateNoteCounts();
}
$("evaluation-notes").addEventListener("input", () =>
	limitNotes($("evaluation-notes"), 8000),
);
function updateOverall() {
	const values = reviewCategories.map(
		([key]) => $(`category-${key}`)?.value ?? "hold",
	);
	const verdict = values.every((value) => value === "pass")
		? "pass"
		: values.includes("needs-change")
			? "needs-change"
			: "hold";
	$("evaluation-overall").textContent =
		`사람의 종합 판정: ${verdict} / 기계 NOT_RUN · 후보 HOLD · 제작 승인 NONE`;
	return verdict;
}
for (const [key, label] of reviewCategories) {
	const group = document.createElement("div");
	group.className = "review-category";
	const selectLabel = text("label", label);
	selectLabel.htmlFor = `category-${key}`;
	const select = document.createElement("select");
	select.id = selectLabel.htmlFor;
	for (const [value, title] of [
		["hold", "hold · 보류"],
		["pass", "pass · 사람의 적합 판정"],
		["needs-change", "needs-change · 수정 필요"],
	]) {
		const option = text("option", title);
		option.value = value;
		select.append(option);
	}
	const notesLabel = text(
		"label",
		`${label} 메모 (최대 2000자; 수정 필요는 사유 필수)`,
	);
	notesLabel.htmlFor = `notes-${key}`;
	const notes = document.createElement("textarea");
	notes.id = notesLabel.htmlFor;
	notes.rows = 2;
	select.addEventListener("change", () => {
		updateOverall();
		captureDraft();
	});
	notes.addEventListener("input", () => limitNotes(notes, 2000));
	const counter = text("p", "0 / 2000", "meta");
	counter.id = `count-${key}`;
	group.append(selectLabel, select, notesLabel, notes, counter);
	$("evaluation-categories").append(group);
}
function renderHistory(result) {
	reviewRevision = result.latest?.revision ?? 0;
	$("review-state").textContent = humanSummary(result.latest);
	$("evaluation-history").replaceChildren();
	for (const record of result.history) {
		const details = document.createElement("details");
		details.append(
			text(
				"summary",
				`revision ${record.revision} / ${record.verdict} / reviewer ${record.reviewerId} / ${record.reviewedAt}`,
			),
			renderValue(record),
		);
		$("evaluation-history").append(details);
	}
	if (!result.history.length)
		$("evaluation-history").append(
			text("p", "서버 기록 없음 / expectedRevision 0"),
		);
}
function humanSummary(latest) {
	return latest
		? `사람의 최신 검토: revision ${latest.revision} / ${latest.verdict} / reviewer ${latest.reviewerId} / ${latest.reviewedAt}. 실행 후보 HOLD · 기계 NOT_RUN · 제작 승인 NONE`
		: "사람의 검토: 서버 기록 없음 / revision 0. 실행 후보 HOLD · 기계 NOT_RUN · 제작 승인 NONE";
}
function verifyResult(result, jobId, source) {
	if (
		result?.schema !== "portal-generated-result.v1" ||
		!/^\d+$/.test(result.ownerId) ||
		result.jobId !== jobId ||
		result.imageUrl !== `${apiBase}/jobs/${encodeURIComponent(jobId)}/image` ||
		result.reviewStatus !== "HOLD" ||
		result.approval !== "NONE" ||
		![
			result.snapshotSHA,
			result.pngSHA,
			result.receiptSHA,
			result.machineEvidence?.metricsSHA,
		].every((hash) => shaPattern.test(hash)) ||
		result.machineEvidence.schema !== "portal-result-metrics.v1" ||
		result.machineEvidence.pngSHA !== result.pngSHA ||
		result.machineEvidence.receiptSHA !== result.receiptSHA ||
		(source?.batchId &&
			(result.batchId !== source.batchId ||
				result.itemId !== source.itemId ||
				result.jobId !== source.requestId ||
				result.snapshotSHA !== source.snapshotSHA))
	)
		throw new Error("RESULT_EVIDENCE_MISMATCH");
}
function verifyEvaluation(record, result) {
	if (
		record?.schema !== "portal-result-evaluation.v1" ||
		![
			"jobId",
			"batchId",
			"itemId",
			"snapshotSHA",
			"pngSHA",
			"receiptSHA",
		].every((key) => record[key] === result[key]) ||
		record.machineMetricsSHA !== result.machineEvidence.metricsSHA ||
		record.approval !== "NONE" ||
		record.reviewerId !== result.ownerId ||
		!Number.isSafeInteger(record.revision) ||
		record.revision < 1 ||
		record.previousRevision !== record.revision - 1 ||
		typeof record.evaluationId !== "string" ||
		!Number.isFinite(Date.parse(record.reviewedAt)) ||
		typeof record.notes !== "string" ||
		Array.from(record.notes).length > 8000 ||
		reviewCategories.some(([key]) => {
			const category = record.categories?.[key];
			return (
				!category ||
				!["pass", "needs-change", "hold"].includes(category.judgement) ||
				typeof category.notes !== "string" ||
				Array.from(category.notes).length > 2000 ||
				(category.judgement === "needs-change" && !category.notes.trim())
			);
		})
	)
		throw new Error("RESULT_EVIDENCE_MISMATCH");
	const values = reviewCategories.map(
		([key]) => record.categories[key].judgement,
	);
	const verdict = values.every((value) => value === "pass")
		? "pass"
		: values.includes("needs-change")
			? "needs-change"
			: "hold";
	if (record.verdict !== verdict) throw new Error("RESULT_EVIDENCE_MISMATCH");
}
async function readVerifiedReview(
	jobId,
	source,
	existingBlob = null,
	expectedResult = null,
) {
	const { result } = await request(`/jobs/${encodeURIComponent(jobId)}/result`);
	verifyResult(result, jobId, source);
	if (expectedResult && !sameBinding(result, expectedResult))
		throw new Error("RESULT_EVIDENCE_MISMATCH");
	const blob =
		existingBlob ??
		(await request(`/jobs/${encodeURIComponent(jobId)}/image`, {}, true));
	if (blob.type.split(";")[0] !== "image/png")
		throw new Error("INVALID_IMAGE_CONTENT_TYPE");
	const digest = [
		...new Uint8Array(
			await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
		),
	]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	if (digest !== result.pngSHA) throw new Error("RESULT_HASH_MISMATCH");
	const evaluations = await request(
		`/jobs/${encodeURIComponent(jobId)}/evaluations`,
	);
	verifyResult(evaluations.resultBinding, jobId, source);
	if (
		![
			"ownerId",
			"jobId",
			"batchId",
			"itemId",
			"snapshotSHA",
			"pngSHA",
			"receiptSHA",
		].every((key) => evaluations.resultBinding[key] === result[key]) ||
		JSON.stringify(evaluations.machineEvidence) !==
			JSON.stringify(result.machineEvidence) ||
		JSON.stringify(evaluations.resultBinding.machineEvidence) !==
			JSON.stringify(result.machineEvidence) ||
		!Array.isArray(evaluations.history)
	)
		throw new Error("RESULT_EVIDENCE_MISMATCH");
	const ids = new Set();
	for (const [index, record] of evaluations.history.entries()) {
		verifyEvaluation(record, result);
		if (record.revision !== index + 1 || ids.has(record.evaluationId))
			throw new Error("RESULT_EVIDENCE_MISMATCH");
		ids.add(record.evaluationId);
	}
	if (
		JSON.stringify(evaluations.latest) !==
		JSON.stringify(evaluations.history.at(-1) ?? null)
	)
		throw new Error("RESULT_EVIDENCE_MISMATCH");
	return { result, evaluations, blob };
}
async function refreshBatchSummary(batch, entry) {
	const authEpoch = epoch;
	const version = batchVersion;
	const token = Symbol();
	entry.token = token;
	const current = () =>
		authEpoch === epoch &&
		version === batchVersion &&
		activeBatch === batch &&
		batchSummaries.get(entry.item.itemId) === entry &&
		entry.token === token;
	try {
		const { evaluations } = await readVerifiedReview(entry.item.jobId, {
			...entry.item,
			batchId: batch.batchId,
		});
		if (current()) entry.node.textContent = humanSummary(evaluations.latest);
	} catch (error) {
		if (current())
			entry.node.textContent = `사람의 검토: 확인 불가 (${errorMessage(error)}). 실행 ${entry.item.status}와 별개입니다.`;
	}
}
function updateReviewedSummary(result, evaluations) {
	const entry = batchSummaries.get(result.itemId);
	if (
		!entry ||
		activeBatch?.batchId !== result.batchId ||
		entry.batchId !== result.batchId ||
		entry.item.jobId !== result.jobId ||
		entry.item.requestId !== result.jobId ||
		entry.item.snapshotSHA !== result.snapshotSHA
	)
		return;
	entry.token = null;
	entry.node.textContent = humanSummary(evaluations.latest);
}
async function loadReview(existingBlob = null) {
	if (!session || activeJob?.state !== "HOLD" || reviewPending) return;
	const authEpoch = epoch;
	const job = activeJob;
	const selection = resultSelectionVersion;
	const version = ++resultVersion;
	const current = () =>
		authEpoch === epoch &&
		version === resultVersion &&
		selection === resultSelectionVersion &&
		activeJob === job;
	const priorBinding = reviewBinding;
	captureDraft();
	reviewBinding = null;
	reviewPending = true;
	$("evaluation-fields").disabled = true;
	updateAction();
	notice(
		"review-message",
		"결과 영수증, 검토 이력과 실제 표시 PNG SHA를 확인하고 있습니다.",
	);
	try {
		const { result, evaluations, blob } = await readVerifiedReview(
			job.id,
			job.source,
			existingBlob,
			priorBinding,
		);
		const digest = result.pngSHA;
		if (!current()) return;
		if (!existingBlob) {
			await showPreview(
				blob,
				"검토 대상 생성 결과 (승인 아님)",
				`작업 ${job.id} / PNG SHA ${digest}`,
				authEpoch,
				selection,
				current,
			);
			if (!current()) return;
		}
		clearComparison();
		const decoded = await decodedImageUrl(blob, current);
		if (!decoded || !current()) return;
		const { url: resultUrl, size } = decoded;
		comparisonResultUrl = resultUrl;
		comparisonResultSize = size;
		$("overlay-result").src = resultUrl;
		$("overlay-result").hidden = false;
		$("overlay-result").dataset.jobId = result.jobId;
		reviewBinding = result;
		if (
			job.reference?.schemaVersion === 2 &&
			job.reference.inputMode === "reference-img2img"
		) {
			$("create-alpha").disabled = true;
			$("alpha-message").textContent =
				"v2 투명 출력 340×510 · 별도 알파 변환 영수증 검증됨 · 경계 품질 검토 필요 · 승인 NONE";
		} else void loadAlpha(result);
		$("result-image").src = resultUrl;
		$("result-image").hidden = false;
		$("result-image").dataset.sha = digest;
		$("result-image").dataset.jobId = result.jobId;
		$("result-caption").textContent =
			`생성 결과 / ${result.jobId} / ${size[0]}×${size[1]} px / SHA ${digest}`;
		knownResults.set(result.jobId, {
			...job.source,
			jobId: result.jobId,
			requestId: result.jobId,
			batchId: result.batchId,
			itemId: result.itemId,
			snapshotSHA: result.snapshotSHA,
			status: "HOLD",
		});
		renderResultStrip();
		renderComparison();
		const key = JSON.stringify([
			authEpoch,
			result.ownerId,
			result.jobId,
			result.pngSHA,
		]);
		let record = resultDrafts.get(key);
		if (record && !sameBinding(record.binding, result))
			throw new Error("RESULT_EVIDENCE_MISMATCH");
		if (!record) {
			const empty = {
				categories: Object.fromEntries(
					reviewCategories.map(([key]) => [
						key,
						{ judgement: "hold", notes: "" },
					]),
				),
				notes: "",
				verdict: "hold",
			};
			const baseline = evaluations.latest
				? contentOf(evaluations.latest)
				: empty;
			record = {
				key,
				epoch: authEpoch,
				binding: result,
				source: job.source,
				editable: structuredClone(baseline),
				baseline,
				baseRevision: evaluations.latest?.revision ?? 0,
				latestObservedRevision: evaluations.latest?.revision ?? 0,
				attempt: null,
				verified: true,
			};
			resultDrafts.set(key, record);
		}
		record.verified = true;
		reconcileDraft(record, evaluations);
		reviewDraft = record;
		renderHistory(evaluations);
		updateReviewedSummary(result, evaluations);
		showDraft(record);
		$("result-binding").replaceChildren(renderValue(result));
		$("evaluation-fields").disabled = false;
		updateOverall();
		notice(
			"review-message",
			`실제 표시 PNG SHA 확인 완료: ${digest} / 서버 revision ${reviewRevision}. 사람의 판정은 제작 승인이 아닙니다.`,
		);
		await loadCapturedSource();
	} catch (error) {
		if (current()) {
			if (reviewDraft) reviewDraft.verified = false;
			reviewBinding = null;
			$("evaluation-fields").disabled = true;
			actionError("review-message", error);
		}
	} finally {
		if (current()) {
			reviewPending = false;
			updateAction();
			updateDraftActions();
		}
	}
}
$("load-review").addEventListener("click", () => loadReview());
function clearWorkstationFrames() {
	workstationFrameVersion += 1;
	for (const url of workstationUrls) URL.revokeObjectURL(url);
	workstationUrls.clear();
	$("workstation-frames").replaceChildren();
	notice("workstation-frame-status", "");
}
function renderWorkstationMode() {
	const turntable = activeTask === "turntable";
	const excludedHead = activeTask === "head-without-hair-eyes-teeth";
	const hair = activeTask === "hair";
	$("workstation-title").textContent = turntable
		? "전신 턴테이블 이미지 작업대"
		: excludedHead
			? "머리카락·눈·치아 제외 머리 이미지 작업대"
			: hair
				? "별도 머리카락 참조 이미지 작업대"
				: "부위·참조 이미지 작업대";
	$("workstation-description-text").textContent = turntable
		? "선택한 인물, 봉인된 정체성, 직접 작성한 룩과 서버 스타일에 결속된 정면·프로필·측면·후면 전신 PNG 4장을 만듭니다. 메시·리깅·애니메이션은 만들지 않습니다."
		: excludedHead
			? "머리카락·눈·치아를 모두 제외한 정면 머리 PNG 1장을 별도로 요청합니다. 완전한 분리 머리나 별도 머리카락 출력과 구분하며, 메시·분리 형상은 생성하지 않습니다."
			: hair
				? "완전한 머리·머리카락 없는 머리와 구분된 머리카락 전용 PNG 참조입니다. 기존 task15 머리카락 슬롯을 재사용하며 메시나 분리 형상을 생성하지 않습니다."
				: "이미지만 제작합니다. 3D 모델·리깅·애니메이션은 생성하지 않습니다. 초상 제작과 별도의 명시적 v2 출력 규격을 사용합니다.";
	$("turntable-directions").hidden = !turntable;
	$("workstation-category-field").hidden = turntable || hair;
	$("create-workstation").textContent = turntable
		? "전신 4방향 PNG 한 번 요청"
		: excludedHead
			? "머리카락·눈·치아 제외 머리 PNG 한 번 요청"
			: hair
				? "별도 머리카락 PNG 한 번 요청"
				: "작성한 규격으로 한 번 요청";
}

function workstationCategoryChanged() {
	const category = $("workstation-category").value;
	const exclusions =
		category === "head-without-hair-eyes-teeth"
			? "머리카락·눈·치아 (모두 제외)"
			: "없음";
	notice(
		"workstation-directions",
		category
			? `${workstationLabels[category]} · PNG · ${category === "fullbody-turntable" ? "front → profile → side → back (4장)" : category === "portrait" ? "viewer-right (1장)" : "front (1장)"} · 제외: ${exclusions}`
			: "분류를 명시적으로 선택하세요.",
	);
	notice(
		"workstation-workflow-note",
		category === "torso"
			? "의상 포함 몸통 전용 · 등록 원본 인물, 서버 스타일, 봉인된 초상 결과와 변경 불가 작업 UUID에 연결합니다. 머리와 다리는 출력하지 않습니다."
			: category === "detached-head"
				? "완전한 분리 머리 이미지 전용 · 등록 원본 인물, 서버 스타일, 봉인된 초상 결과에 연결합니다. 투명 PNG와 픽셀 정렬 정보를 보존하며 메시·분리 형상을 생성하지 않습니다."
				: category === "head-without-hair-eyes-teeth"
					? "머리카락·눈·치아 모두 제외 전용 · 등록 원본 인물, 서버 스타일, 봉인된 초상 결과와 변경 불가 작업 UUID에 연결합니다. 투명 배경·픽셀 정렬을 보존합니다. 완전한 분리 머리·별도 머리카락과 다른 출력이며, 의미 검토와 소유자 승인은 별도입니다."
					: category === "hair"
						? "머리카락 전용 · 등록 원본·봉인된 초상 결과·스타일·작업 UUID에 연결된 투명 PNG 정면 1장입니다. task15 제어 슬롯 재사용 · 유료 증거 NOT_RUN. 측면·후면 등 다른 방향은 제어 증거와 구분하며 유료 생성 NOT_RUN입니다. 배정된 유료 증거 1회는 gateway 단일 시도 검증·원본/결과 정체성·소유자 승인(row39/Q4) 전까지 차단됩니다."
						: "분류를 선택하면 해당 이미지 계약만 요청합니다.",
	);
}
async function loadWorkstations() {
	const authEpoch = epoch;
	const version = ++workstationVersion;
	const personId =
		selected?.personId ??
		workstationSource?.personId ??
		$("history-person").value;
	workstationSource = null;
	workstationIdentity = null;
	workstationCatalog = null;
	workstationHistoryVersion += 1;
	clearWorkstationFrames();
	$("workstation-identity").replaceChildren();
	$("workstation-history").replaceChildren();
	$("workstation-style").value = "";
	updateAction();
	notice(
		"workstation-capability",
		"인증된 카탈로그·원본·스타일을 확인 중입니다.",
	);
	try {
		const [catalog, originals, styles] = await Promise.all([
			request("/v2/workstations/catalog"),
			request("/characters"),
			request("/references"),
		]);
		if (authEpoch !== epoch || version !== workstationVersion) return;
		if (
			catalog.schema !== "portal-workstation-catalog.v2" ||
			!Array.isArray(catalog.categories) ||
			catalog.categories.some(
				(kind) => !Object.hasOwn(workstationLabels, kind),
			) ||
			!Array.isArray(originals.characters) ||
			!shaPattern.test(styles.catalog?.styleReferenceSha256)
		)
			throw new Error("WORKSTATION_CATALOG_UNAVAILABLE");
		workstationCatalog = catalog;
		$("workstation-style").value = styles.catalog.styleReferenceSha256;
		for (const [id, label] of [
			["workstation-person", "등록 원본을 선택하세요"],
			["workstation-category", "분류를 선택하세요"],
		]) {
			const empty = text("option", label);
			empty.value = "";
			$(id).replaceChildren(empty);
		}
		for (const person of originals.characters) {
			const option = text(
				"option",
				`${person.name} / ${person.characterId} / ${person.personId}`,
			);
			option.value = person.personId;
			$("workstation-person").append(option);
		}
		for (const category of catalog.categories) {
			const option = text(
				"option",
				`${workstationLabels[category]} / ${category}`,
			);
			option.value = category;
			$("workstation-category").append(option);
		}
		if (activeTask === "turntable")
			$("workstation-category").value = "fullbody-turntable";
		else if (activeTask === "torso") $("workstation-category").value = "torso";
		else if (activeTask === "detached-head")
			$("workstation-category").value = "detached-head";
		else if (activeTask === "head-without-hair-eyes-teeth")
			$("workstation-category").value = "head-without-hair-eyes-teeth";
		else if (activeTask === "hair") $("workstation-category").value = "hair";
		$("workstation-category").disabled = activeTask !== "parts";
		renderWorkstationMode();
		workstationCategoryChanged();
		notice(
			"workstation-capability",
			`운영 생성 BLOCKED · ${catalog.productionGeneration} · 유료 증거 ${catalog.paidProof}. 보관 이미지 조회와 다운로드는 가능합니다.`,
		);
		if (
			personId &&
			[...$("workstation-person").children].some(
				(option) => option.value === personId,
			)
		) {
			$("workstation-person").value = personId;
			await selectWorkstationPerson();
		}
	} catch (error) {
		if (authEpoch === epoch && version === workstationVersion)
			actionError("workstation-capability", error);
	}
}
async function selectWorkstationPerson() {
	const personId = $("workstation-person").value;
	const version = ++workstationVersion;
	const authEpoch = epoch;
	workstationSource = null;
	workstationIdentity = null;
	$("workstation-identity").replaceChildren();
	$("workstation-history").replaceChildren();
	clearWorkstationFrames();
	updateAction();
	notice("workstation-source", "등록 원본과 적격 여부 확인 중입니다.");
	notice("workstation-identity-status", "봉인된 결과를 선택하세요.");
	if (!/^person-\d+$/.test(personId)) return;
	void loadWorkstationHistory();
	try {
		const [source, wiki, owned] = await Promise.all([
			request(`/characters/${personId}`),
			request(`/wiki/people/${personId}`),
			request("/jobs"),
		]);
		if (authEpoch !== epoch || version !== workstationVersion) return;
		if (
			source.personId !== personId ||
			wiki.personId !== personId ||
			source.characterId !== wiki.characterId ||
			!["detail", "token", "image"].every((key) =>
				shaPattern.test(source.sourceHashes?.[key]),
			)
		)
			throw new Error("WORKSTATION_SOURCE_UNAVAILABLE");
		workstationSource = {
			...source,
			eligible: wiki.generationEligibility?.eligible === true,
		};
		selectSharedHistoryPerson(personId);
		notice(
			"workstation-source",
			`${source.name} / ${source.personId} · ${workstationSource.eligible ? "적격 등록 원본 · 별도 디자인을 직접 작성하세요" : `생성 불가: ${wiki.generationEligibility?.reason ?? "적격 미확인"}`}`,
		);
		const empty = text("option", "봉인된 초상 결과를 선택하세요");
		empty.value = "";
		$("workstation-identity").append(empty);
		for (const row of owned.history ?? []) {
			if (
				row.source?.personId !== personId ||
				row.job.state !== "HOLD" ||
				!row.job.imageUrl
			)
				continue;
			const option = text("option", `${row.job.id} / HOLD`);
			option.value = row.job.id;
			$("workstation-identity").append(option);
		}
		if ($("workstation-identity").children.length === 1)
			notice(
				"workstation-identity-status",
				"사용 가능한 초상 결과가 없습니다. 기존 초상 작업대에서 결과를 확인하세요.",
			);
	} catch (error) {
		if (authEpoch === epoch && version === workstationVersion)
			actionError("workstation-source", error);
	} finally {
		if (authEpoch === epoch && version === workstationVersion) updateAction();
	}
}
async function selectWorkstationIdentity() {
	const id = $("workstation-identity").value;
	const person = workstationSource;
	const version = ++workstationVersion;
	const authEpoch = epoch;
	workstationIdentity = null;
	updateAction();
	if (!id || !person) return;
	try {
		const { identity } = await request(
			`/references/identities/${encodeURIComponent(id)}`,
		);
		if (authEpoch !== epoch || version !== workstationVersion) return;
		if (
			identity.resultId !== id ||
			identity.personId !== person.personId ||
			!shaPattern.test(identity.pngSHA)
		)
			throw new Error("REFERENCE_IDENTITY_MISMATCH");
		workstationIdentity = identity;
		notice(
			"workstation-identity-status",
			`봉인 결과 ${id} · PNG SHA ${identity.pngSHA} · 승인 NONE`,
		);
	} catch (error) {
		if (authEpoch === epoch && version === workstationVersion)
			actionError("workstation-identity-status", error);
	} finally {
		if (authEpoch === epoch && version === workstationVersion) updateAction();
	}
}
async function workstationHash(bytes) {
	return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
		.map((n) => n.toString(16).padStart(2, "0"))
		.join("");
}
async function workstationEnvelope() {
	const category = $("workstation-category").value;
	const person = workstationSource;
	const identity = workstationIdentity;
	const connectionId = connection?.connectionId;
	const styleReferenceSha256 = $("workstation-style").value;
	const identifier = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
	if (
		!person?.eligible ||
		identity?.personId !== person.personId ||
		person.personId !== $("workstation-person").value ||
		!workstationCatalog?.categories.includes(category) ||
		!["detail", "token", "image"].every((key) =>
			shaPattern.test(person.sourceHashes?.[key]),
		) ||
		!shaPattern.test(identity?.pngSHA) ||
		!/^[0-9]+$/.test(session?.user?.id ?? "")
	)
		throw new Error("WORKSTATION_SOURCE_UNAVAILABLE");
	const sourceId = $("workstation-source-id").value.trim();
	const description = $("workstation-description").value.trim();
	const canvasId = $("workstation-canvas").value.trim();
	if (
		!identifier.test(sourceId) ||
		!identifier.test(canvasId) ||
		!description ||
		description.length > 16000
	)
		throw new Error("WORKSTATION_AUTHORED_LOOK_REQUIRED");
	const number = (key) => {
		const raw = $(`workstation-${key}`).value.trim();
		if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)))
			throw new Error("WORKSTATION_OUTPUT_REQUIRED");
		return Number(raw);
	};
	const width = number("width"),
		height = number("height");
	const anchor = [number("anchor-x"), number("anchor-y")];
	const crop = [
		number("left"),
		number("top"),
		number("right"),
		number("bottom"),
	];
	if (
		width < 1 ||
		width > 4096 ||
		height < 1 ||
		height > 4096 ||
		crop[0] >= crop[2] ||
		crop[1] >= crop[3] ||
		crop[2] > width ||
		crop[3] > height ||
		anchor[0] < crop[0] ||
		anchor[0] >= crop[2] ||
		anchor[1] < crop[1] ||
		anchor[1] >= crop[3]
	)
		throw new Error("WORKSTATION_OUTPUT_INVALID");
	const kind = $("workstation-background").value;
	let background;
	if (kind === "transparent") background = { kind, alpha: "zero-background" };
	else if (
		kind === "solid" &&
		![
			"portrait",
			"detached-head",
			"head-without-hair-eyes-teeth",
			"hair",
		].includes(category)
	) {
		const raw = $("workstation-rgb").value.trim();
		if (!/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(raw))
			throw new Error("WORKSTATION_RGB_REQUIRED");
		const rgb = raw.split(",").map(Number);
		if (rgb.some((n) => n > 255)) throw new Error("WORKSTATION_RGB_REQUIRED");
		background = { kind, alpha: "opaque", rgb };
	} else throw new Error("WORKSTATION_BACKGROUND_REQUIRED");
	const look = {
		schemaVersion: 2,
		sourceId,
		lookId: sourceId,
		personId: person.personId,
		characterId: person.characterId,
		category,
		status: "owner-authored",
		description,
	};
	const lookBytes = new TextEncoder().encode(JSON.stringify(look));
	if (lookBytes.length > 24576)
		throw new Error("WORKSTATION_AUTHORED_LOOK_TOO_LARGE");
	const views =
		category === "fullbody-turntable"
			? ["front", "profile", "side", "back"]
			: [category === "portrait" ? "viewer-right" : "front"];
	const frames = await Promise.all(
		views.map(async (view, frameOrder) => {
			const outputSpec = {
				schemaVersion: 2,
				category,
				variant:
					category === "head-without-hair-eyes-teeth"
						? "exclude-hair-eyes-teeth"
						: category === "underwear-only-torso"
							? "authored-underwear"
							: "complete",
				view,
				frameOrder,
				format: "png",
				width,
				height,
				background,
				alignment: {
					canvasId,
					coordinates: "pixels-top-left-x-right-y-down",
					anchor,
					crop,
				},
				featureExclusions:
					category === "head-without-hair-eyes-teeth"
						? ["hair", "eyes", "teeth"]
						: [],
			};
			return {
				outputSpec,
				outputSpecSha256: await workstationHash(
					new TextEncoder().encode(JSON.stringify(outputSpec)),
				),
			};
		}),
	);
	return {
		request: {
			schemaVersion: 2,
			requestId: crypto.randomUUID(),
			connectionId,
			personId: person.personId,
			providerModel: model,
			identityResultId: identity.resultId,
			styleReferenceSha256,
			faceMode: identity.faceMode,
			authoredLook: {
				sourceId,
				lookId: look.lookId,
				sha256: await workstationHash(lookBytes),
			},
			sourceBinding: {
				schemaVersion: 2,
				ownerId: session.user.id,
				characterId: person.characterId,
				originalHashes: person.sourceHashes,
				identityPngSHA: identity.pngSHA,
			},
			frames,
		},
		authoredLookBase64: btoa(
			Array.from(lookBytes, (n) => String.fromCharCode(n)).join(""),
		),
	};
}
async function submitWorkstation() {
	if (
		!session ||
		!connectionReady() ||
		ownerBlocked ||
		workstationPending ||
		pending ||
		batchPending ||
		batchLocked()
	)
		return;
	const authEpoch = epoch;
	const version = workstationVersion;
	let sent = false;
	workstationPending = true;
	updateAction();
	try {
		const envelope = await workstationEnvelope();
		if (authEpoch !== epoch || version !== workstationVersion) return;
		$("workstation-status").dataset.state = "RUNNING";
		notice(
			"workstation-status",
			`요청 ${envelope.request.requestId} · 전송 중. 자동 재시도 없음.`,
		);
		sent = true;
		const result = await request("/v2/workstations", {
			method: "POST",
			body: JSON.stringify(envelope),
		});
		if (authEpoch !== epoch) return;
		if (
			result.job?.id !== envelope.request.requestId ||
			!["HOLD", "FAILED", "UNKNOWN"].includes(result.job?.state)
		)
			throw new Error("WORKSTATION_RESULT_INVALID");
		if (result.job.state === "UNKNOWN") ownerBlocked = true;
		if (version !== workstationVersion) return;
		$("workstation-status").dataset.state = result.job?.state ?? "UNKNOWN";
		notice(
			"workstation-status",
			`${result.job?.state ?? "UNKNOWN"} · ${envelope.request.requestId} · 후보 검토 HOLD · 승인 NONE · 유료 증거 NOT_RUN`,
		);
		await loadWorkstationHistory();
	} catch (error) {
		if (authEpoch !== epoch) return;
		const blocked = errorMessage(error) === "REFERENCE_PRODUCTION_BLOCKED";
		if (sent && !blocked && (!error.status || error.status >= 500))
			ownerBlocked = true;
		if (version !== workstationVersion) return;
		$("workstation-status").dataset.state = blocked
			? "BLOCKED"
			: ownerBlocked
				? "UNKNOWN"
				: "INVALID";
		notice(
			"workstation-status",
			`${$("workstation-status").dataset.state} · ${errorMessage(error)} · 자동 재시도 없음. ${blocked ? "운영 생성은 차단되어 있습니다. 보관 이력을 확인하세요." : "입력과 기존 서버 이력을 확인하세요."}`,
			true,
		);
	} finally {
		if (authEpoch === epoch) {
			workstationPending = false;
			updateAction();
		}
	}
}
async function loadWorkstationHistory() {
	const personId = $("workstation-person").value;
	const authEpoch = epoch;
	const version = ++workstationHistoryVersion;
	if (!/^person-\d+$/.test(personId)) return;
	notice("workstation-history-status", "인물별 보관 이력 확인 중입니다.");
	try {
		const history = await request(`/v2/workstations/${personId}/history`);
		if (
			authEpoch !== epoch ||
			version !== workstationHistoryVersion ||
			personId !== $("workstation-person").value
		)
			return;
		if (
			history.schema !== "portal-workstation-history.v2" ||
			!Array.isArray(history.items)
		)
			throw new Error("WORKSTATION_HISTORY_INVALID");
		$("workstation-history").replaceChildren();
		for (const item of history.items) {
			if (
				item.request.personId !== personId ||
				item.request.requestId !== item.job.id
			)
				throw new Error("WORKSTATION_HISTORY_INVALID");
			const category = item.request.frames[0]?.outputSpec.category;
			if (activeTask === "turntable" && category !== "fullbody-turntable")
				continue;
			if (
				activeTask === "head-without-hair-eyes-teeth" &&
				category !== activeTask
			)
				continue;
			if (activeTask === "hair" && category !== "hair") continue;
			const button = text(
				"button",
				`${workstationLabels[category] ?? category} / ${item.job.state} / ${item.job.id}`,
			);
			button.type = "button";
			button.dataset.jobId = item.job.id;
			button.addEventListener("click", () =>
				loadWorkstationFrames(personId, item.job.id),
			);
			$("workstation-history").append(button);
		}
		const visibleCount = $("workstation-history").children.length;
		notice(
			"workstation-history-status",
			`${personId} · ${visibleCount}개 ${activeTask === "turntable" ? "전신 턴테이블 " : ""}보관 작업. HOLD는 후보이며 승인 NONE입니다.`,
		);
	} catch (error) {
		if (authEpoch === epoch && version === workstationHistoryVersion)
			actionError("workstation-history-status", error);
	}
}
async function loadWorkstationFrames(personId, jobId) {
	clearWorkstationFrames();
	const version = workstationFrameVersion;
	const authEpoch = epoch;
	const current = () =>
		authEpoch === epoch &&
		version === workstationFrameVersion &&
		personId === $("workstation-person").value;
	const route = `/v2/workstations/${encodeURIComponent(personId)}/${encodeURIComponent(jobId)}`;
	notice("workstation-frame-status", "서버 색인과 PNG SHA 확인 중입니다.");
	try {
		const result = await request(route);
		if (!current()) return;
		if (result.job.id !== jobId || result.request.personId !== personId)
			throw new Error("WORKSTATION_HISTORY_INVALID");
		if (result.job.state !== "HOLD") {
			notice(
				"workstation-frame-status",
				`${result.job.state} · ${jobId} · 검증된 완성 이미지 없음`,
			);
			return;
		}
		if (
			!Array.isArray(result.index) ||
			result.index.length !== result.request.frames.length
		)
			throw new Error("WORKSTATION_INDEX_INVALID");
		const category = result.request.frames[0]?.outputSpec.category;
		if (
			category === "fullbody-turntable" &&
			(result.index.length !== 4 ||
				JSON.stringify(result.index.map((frame) => frame.view)) !==
					JSON.stringify(["front", "profile", "side", "back"]))
		)
			throw new Error("WORKSTATION_INDEX_INVALID");
		const group = document.createElement("section");
		group.className = "workstation-person-group";
		group.dataset.personId = personId;
		group.dataset.jobId = jobId;
		group.dataset.identityResultId = result.request.identityResultId;
		group.append(
			text(
				"h3",
				`${workstationSource?.name ?? personId} · ${workstationLabels[category] ?? category}`,
			),
			text(
				"p",
				`인물 ${personId} · 정체성 요청 ${result.request.identityResultId} · 작업 ${jobId}`,
				"meta workstation-person-binding",
			),
		);
		const frames = document.createElement("ol");
		frames.className = "workstation-frame-list";
		for (const [order, frame] of result.index.entries()) {
			const spec = result.request.frames[order]?.outputSpec;
			if (
				frame.parentRequestId !== jobId ||
				frame.personId !== personId ||
				frame.frameOrder !== order ||
				frame.category !== spec.category ||
				frame.view !== spec.view ||
				frame.outputSpecSha256 !== result.request.frames[order].outputSpecSha256
			)
				throw new Error("WORKSTATION_INDEX_INVALID");
			const blob = await request(`${route}/frames/${order}/image`, {}, true);
			const digest = await workstationHash(await blob.arrayBuffer());
			if (!current()) return;
			if (digest !== frame.pngSHA) throw new Error("RESULT_HASH_MISMATCH");
			const url = URL.createObjectURL(blob);
			workstationUrls.add(url);
			const item = document.createElement("li");
			item.className = "workstation-frame-item";
			item.dataset.frameOrder = String(order);
			item.dataset.requestId = frame.childRequestId;
			item.dataset.view = frame.view;
			const figure = document.createElement("figure");
			const image = document.createElement("img");
			image.src = url;
			image.alt = `${personId} / ${workstationLabels[frame.category]} / ${frame.view}`;
			image.width = spec.width;
			image.height = spec.height;
			await image.decode();
			if (!current()) return;
			if (
				image.naturalWidth !== spec.width ||
				image.naturalHeight !== spec.height
			)
				throw new Error("WORKSTATION_OUTPUT_INVALID");
			const stage = document.createElement("div");
			stage.className = "portrait-frame workstation-frame-preview";
			stage.append(image);
			const direction = turntableLabels[frame.view] ?? frame.view;
			const caption = text(
				"figcaption",
				`${frame.category} / ${direction} / ${spec.width}×${spec.height} px · 인물 ${personId} · 스타일 SHA ${result.request.styleReferenceSha256} · 작업 ${jobId} · 프레임 ${frame.childRequestId} · 배경 ${spec.background.kind}${spec.background.alpha === "zero-background" ? " alpha 0" : ""} · 정렬 ${spec.alignment.canvasId} / anchor ${spec.alignment.anchor.join(",")} / crop ${spec.alignment.crop.join(",")} · PNG SHA ${digest} · 규격 SHA ${frame.outputSpecSha256} · 의미 검토 UNVERIFIED · 승인 NONE`,
			);
			const metadata = document.createElement("dl");
			metadata.className = "fields workstation-frame-metadata";
			for (const [label, value] of [
				["출력 분류", workstationLabels[frame.category] ?? frame.category],
				["변형", spec.variant],
				[
					"제외 부위",
					spec.featureExclusions.length ? "머리카락·눈·치아" : "없음",
				],
				["순서", `${order + 1} / ${result.index.length}`],
				["방향", `${direction} (${frame.view})`],
				["프레임 요청 UUID", frame.childRequestId],
				["PNG SHA-256", digest],
				["규격 SHA-256", frame.outputSpecSha256],
				["검증", "기술 PASS · 의미 UNVERIFIED · 승인 NONE"],
			])
				metadata.append(text("dt", label), text("dd", value));
			const download = text("a", `${direction} PNG 다운로드`);
			download.href = `${apiBase}${route}/frames/${order}/image`;
			download.download = `${personId}-${frame.category}-${jobId}-${frame.view}.png`;
			figure.append(stage, caption);
			item.append(figure, metadata, download);
			frames.append(item);
		}
		group.append(frames);
		$("workstation-frames").append(group);
		notice(
			"workstation-frame-status",
			`${personId} / ${jobId} · ${result.index.length}장 SHA 확인 · HOLD · 유료 증거 NOT_RUN`,
		);
	} catch (error) {
		if (current()) {
			clearWorkstationFrames();
			actionError("workstation-frame-status", error);
		}
	}
}
$("load-workstations").addEventListener("click", loadWorkstations);
$("workstation-person").addEventListener("change", selectWorkstationPerson);
$("workstation-identity").addEventListener("change", selectWorkstationIdentity);
$("workstation-category").addEventListener(
	"change",
	workstationCategoryChanged,
);
$("refresh-workstation-history").addEventListener(
	"click",
	loadWorkstationHistory,
);
$("workstation-form").addEventListener("submit", (event) => {
	event.preventDefault();
	return submitWorkstation();
});
$("reference-identity").addEventListener("input", () => {
	referenceIdentity = null;
	updateAction();
});
$("load-reference-identity").addEventListener("click", async () => {
	const id = $("reference-identity").value.trim();
	try {
		const { identity } = await request(
			`/references/identities/${encodeURIComponent(id)}`,
		);
		if (identity.resultId !== id || identity.personId !== selected?.personId)
			throw new Error("REFERENCE_IDENTITY_MISMATCH");
		referenceIdentity = identity;
		notice(
			"reference-message",
			`봉인된 입력 확인: ${identity.personId} / ${identity.resultId}. 제작 승인 NONE`,
		);
		document.dispatchEvent(
			new CustomEvent("portal:reference-identity", { detail: identity }),
		);
		updateAction();
	} catch (error) {
		referenceIdentity = null;
		actionError("reference-message", error);
		updateAction();
	}
});
$("load-references").addEventListener("click", async () => {
	try {
		const { catalog } = await request("/references");
		const kinds = [
			"front",
			"profile",
			"side",
			"back",
			"head",
			"hair",
			"upper",
			"lower",
			"footwear",
		];
		if (JSON.stringify(catalog.kinds) !== JSON.stringify(kinds))
			throw new Error("REFERENCE_CATALOG_MISMATCH");
		referenceCatalog = catalog;
		$("reference-shots").replaceChildren(text("legend", "출력 이미지 선택"));
		for (const kind of kinds) {
			const label = text("label", kind, "check-label");
			const input = document.createElement("input");
			input.type = "checkbox";
			input.value = kind;
			input.name = "reference-shot";
			input.checked = kind === "hair";
			label.prepend(input);
			$("reference-shots").append(label);
		}
		$("reference-style").value = catalog.styleReferenceSha256 ?? "";
		$("reference-identity").value = reviewBinding?.jobId ?? "";
		notice(
			"reference-message",
			`유료 증거 ${catalog.paidProof} · ${catalog.productionGeneration}. 봉인된 결과와 서버 스타일을 사용합니다.`,
		);
		updateAction();
	} catch (error) {
		actionError("reference-message", error);
	}
});
$("create-references").addEventListener("click", async () => {
	if (
		$("create-references").disabled ||
		!selected?.personId ||
		!referenceIdentity
	)
		return;
	const shots = [
		...document.querySelectorAll('input[name="reference-shot"]:checked'),
	].map((input) => input.value);
	if (!shots.length) {
		notice("reference-message", "한 가지 이상 선택하세요.", true);
		return;
	}
	const authEpoch = epoch;
	referencePending = true;
	updateAction();
	try {
		const result = await request("/references", {
			method: "POST",
			body: JSON.stringify({
				requestId: crypto.randomUUID(),
				connectionId: connection.connectionId,
				personId: selected.personId,
				providerModel: model,
				shots,
				identityResultId: referenceIdentity.resultId,
				styleReferenceSha256: $("reference-style").value,
				faceMode: referenceIdentity.faceMode,
			}),
		});
		if (authEpoch !== epoch) return;
		$("reference-results").replaceChildren(renderValue(result));
		if (result.job.state === "UNKNOWN") ownerBlocked = true;
		for (const shot of result.manifest.shots.filter(
			(item) => item.status === "SUCCEEDED",
		)) {
			const link = text("a", `${shot.shot} PNG`);
			link.href = `${apiBase}/references/${result.job.id}/${shot.shot}/image`;
			link.download = `${shot.shot}.png`;
			$("reference-results").append(link);
		}
		notice(
			"reference-message",
			`${result.job.state} · 유료 증거 NOT_RUN · 제작 승인 NONE`,
		);
		document.dispatchEvent(
			new CustomEvent("portal:references-complete", {
				detail: { requestId: result.job.id, state: result.job.state },
			}),
		);
	} catch (error) {
		if (authEpoch === epoch) {
			actionError("reference-message", error);
			document.dispatchEvent(
				new CustomEvent("portal:references-complete", {
					detail: { error: errorMessage(error) },
				}),
			);
		}
	} finally {
		referencePending = false;
		updateAction();
	}
});
function verifyAttempt(evaluation, record, attempt) {
	verifyEvaluation(evaluation, record.binding);
	if (
		evaluation.evaluationId !== attempt.payload.evaluationId ||
		evaluation.previousRevision !== attempt.payload.expectedRevision ||
		evaluation.revision !== attempt.payload.expectedRevision + 1 ||
		!sameContent(contentOf(evaluation), attempt.content)
	)
		throw new Error("RESULT_EVIDENCE_MISMATCH");
}
function reconcileDraft(record, evaluations) {
	record.latestObservedRevision = evaluations.latest?.revision ?? 0;
	if (!record.attempt) return;
	const match = evaluations.history.find(
		(item) => item.evaluationId === record.attempt.payload.evaluationId,
	);
	if (!match) return;
	try {
		verifyAttempt(match, record, record.attempt);
	} catch (error) {
		record.evidenceError = true;
		throw error;
	}
	record.baseline = structuredClone(record.attempt.content);
	record.baseRevision = match.revision;
	record.attempt = null;
}
async function sendEvaluation(record) {
	const attempt = record.attempt;
	const live = () =>
		record.epoch === epoch && resultDrafts.get(record.key) === record;
	const visible = () =>
		live() && reviewDraft === record && Boolean(reviewBinding);
	attempt.state = "sending";
	updateDraftActions();
	try {
		const response = await request(
			`/jobs/${encodeURIComponent(record.binding.jobId)}/evaluations`,
			{ method: "POST", body: attempt.body },
		);
		if (!live()) return;
		verifyAttempt(response.evaluation, record, attempt);
		const verified = await readVerifiedReview(
			record.binding.jobId,
			record.source,
			null,
			record.binding,
		);
		if (!live()) return;
		captureDraft();
		reconcileDraft(record, verified.evaluations);
		if (record.attempt) throw new Error("RESULT_EVIDENCE_MISMATCH");
		updateReviewedSummary(verified.result, verified.evaluations);
		if (visible()) {
			renderHistory(verified.evaluations);
			notice(
				"review-message",
				`서버 저장 완료 / revision ${record.baseRevision}. 후보 HOLD · 기계 NOT_RUN · 제작 승인 NONE`,
			);
		}
	} catch (error) {
		if (!live()) return;
		if (errorMessage(error) === "EVALUATION_REVISION_CONFLICT") {
			record.attempt = null;
			try {
				const verified = await readVerifiedReview(
					record.binding.jobId,
					record.source,
					null,
					record.binding,
				);
				if (!live()) return;
				record.latestObservedRevision =
					verified.evaluations.latest?.revision ?? 0;
				record.baseRevision = record.latestObservedRevision;
				if (visible()) renderHistory(verified.evaluations);
			} catch (refreshError) {
				if (live()) record.verified = false;
				if (visible()) actionError("review-message", refreshError);
				return;
			}
		} else if (
			!error.status ||
			error.status >= 500 ||
			errorMessage(error) === "REQUEST_CONFLICT"
		) {
			attempt.state = "uncertain";
			if (
				["RESULT_EVIDENCE_MISMATCH", "REQUEST_CONFLICT"].includes(
					errorMessage(error),
				)
			)
				record.evidenceError = true;
		} else record.attempt = null;
		if (visible()) actionError("review-message", error);
	} finally {
		if (live()) updateDraftActions();
	}
}
$("evaluation-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	if (
		!session ||
		!reviewBinding ||
		!reviewDraft?.verified ||
		reviewDraft.evidenceError ||
		reviewPending ||
		reviewDraft.attempt ||
		$("evaluation-fields").disabled
	)
		return;
	captureDraft();
	const record = reviewDraft;
	const content = structuredClone(record.editable);
	if (
		Array.from(content.notes).length > 8000 ||
		Object.values(content.categories).some(
			(value) =>
				Array.from(value.notes).length > 2000 ||
				(value.judgement === "needs-change" && !value.notes.trim()),
		)
	) {
		actionError("review-message", new Error("INVALID_EVALUATION_NOTES"));
		return;
	}
	const payload = {
		evaluationId: crypto.randomUUID(),
		expectedRevision: record.baseRevision,
		pngSHA: record.binding.pngSHA,
		receiptSHA: record.binding.receiptSHA,
		machineMetricsSHA: record.binding.machineEvidence.metricsSHA,
		...content,
	};
	record.attempt = {
		content,
		payload,
		body: JSON.stringify(payload),
		state: "sending",
	};
	await sendEvaluation(record);
});
$("retry-evaluation").addEventListener("click", () => {
	if (
		reviewDraft?.verified &&
		!reviewDraft.evidenceError &&
		reviewDraft.attempt?.state === "uncertain"
	)
		return sendEvaluation(reviewDraft);
});
let localAiCatalog = null;
let localAiVersion = 0;
let localAiPending = false;
let localAiAttempt = null;
function clearLocalAi() {
	localAiVersion += 1;
	localAiCatalog = null;
	localAiPending = false;
	localAiAttempt = null;
	$("local-ai-form").reset();
	$("local-ai-job").replaceChildren();
	$("local-ai-artifacts").replaceChildren();
	$("local-ai-asset").replaceChildren();
	notice("local-ai-status", "아직 제출한 작업이 없습니다.");
	updateLocalAi();
}
function localAiEntry() {
	return localAiCatalog?.find(
		(entry) => entry.tool === $("local-ai-tool").value,
	);
}
function updateLocalAi() {
	const entry = localAiEntry();
	const motion = $("local-ai-tool").value === "unimate";
	$("local-ai-description").textContent = motion
		? "UniMate: 준비된 rig 입력에 동작 설명을 적용합니다. rig 없는 GLB는 사용할 수 없습니다."
		: "UniForge3D: 승인된 순서의 multiview 이미지로 3D를 재구성합니다. 결과에 rig·skeleton은 없으며 UniMate에 자동 연결되지 않습니다.";
	$("local-ai-prompt-field").hidden = !motion;
	$("local-ai-prompt").disabled = !motion;
	const reasons = [];
	if (!session) reasons.push("인증 세션이 필요합니다.");
	if (!entry) reasons.push("도구 준비 상태를 확인하세요.");
	if (entry?.missingModels?.length)
		reasons.push("모델 누락: " + entry.missingModels.join(", "));
	if (entry?.licenseRequired) reasons.push("모델 사용권 승인이 필요합니다.");
	if (entry?.unsupportedRuntime) reasons.push("지원되지 않는 runtime입니다.");
	if (entry && entry.configurationEligible !== true)
		reasons.push("GPU 유지보수 실행 설정 승인이 필요합니다.");
	if (entry?.error) reasons.push("서버 진단: " + entry.error);
	if (!entry?.assets?.length)
		reasons.push(
			motion
				? "승인된 rig 입력이 없습니다."
				: "승인된 multiview 입력이 없습니다.",
		);
	else if (!entry.assets.includes($("local-ai-asset").value))
		reasons.push("서버 승인 입력을 선택하세요.");
	const prompt = $("local-ai-prompt").value;
	if (
		motion &&
		(!prompt.trim() || prompt.length > 2000 || prompt.includes("\0"))
	)
		reasons.push("동작 설명은 공백이 아닌 1~2000자여야 합니다.");
	const raw = $("local-ai-seed").value;
	const seed = Number(raw);
	if (
		raw.trim() === "" ||
		!Number.isInteger(seed) ||
		seed < 0 ||
		seed > 2147483647
	)
		reasons.push("Seed를 0~2147483647 정수로 입력하세요.");
	if (localAiPending) reasons.push("서버 응답 확인 중입니다.");
	if (localAiAttempt && !["succeeded", "failed"].includes(localAiAttempt.state))
		reasons.push("기존 UUID의 상태를 확인하세요. 새 요청은 잠겨 있습니다.");
	$("local-ai-submit").disabled =
		reasons.length > 0 || entry?.configurationEligible !== true;
	$("local-ai-refresh").disabled = !localAiAttempt || localAiPending;
	$("local-ai-refresh-catalog").disabled = localAiPending;
	notice(
		"local-ai-readiness",
		reasons.join(" · ") ||
			(entry?.configurationEligible === true
				? "설정 자격 확인됨 · 활성 GPU 유지보수 준비는 미확인입니다. 생성 요청 시 실제 lease 획득 후에만 실행합니다."
				: "서버 실행 준비가 확인되지 않았습니다."),
	);
}
function localAiToolChanged() {
	const asset = $("local-ai-asset");
	asset.replaceChildren(text("option", "승인 입력을 선택하세요"));
	asset.firstChild.value = "";
	for (const id of localAiEntry()?.assets ?? []) {
		const option = text("option", id);
		option.value = id;
		asset.append(option);
	}
	updateLocalAi();
}
async function loadLocalAiCatalog() {
	const authEpoch = epoch;
	const version = ++localAiVersion;
	localAiPending = true;
	updateLocalAi();
	try {
		const result = await request("/local-ai/catalog");
		if (authEpoch !== epoch || version !== localAiVersion) return;
		localAiCatalog = result.tools;
		localAiToolChanged();
	} catch (error) {
		if (authEpoch === epoch && version === localAiVersion) {
			localAiCatalog = null;
			notice(
				"local-ai-status",
				"준비 상태를 확인하지 못했습니다: " + errorMessage(error),
				true,
			);
		}
	} finally {
		if (authEpoch === epoch && version === localAiVersion) {
			localAiPending = false;
			updateLocalAi();
		}
	}
}
function receiveLocalAi(job) {
	if (job.id !== localAiAttempt?.requestId)
		throw new Error("LOCAL_AI_JOB_MISMATCH");
	localAiAttempt.state = job.state;
	const states = {
		queued: "대기 중",
		running: "실행 중",
		succeeded: "기술적 생성 성공",
		failed: "생성 실패",
		unknown: "실행 결과 미확인 · 자동 재제출하지 않습니다",
	};
	notice(
		"local-ai-status",
		(states[job.state] ?? "미확인 상태") +
			(job.errorCode ? " · " + job.errorCode : ""),
		job.state === "failed" || job.state === "unknown",
	);
	const details = $("local-ai-job");
	details.replaceChildren();
	for (const [label, value] of [
		["작업 UUID", job.id],
		["도구", job.request.tool],
		["입력", job.request.assetId],
		["Seed", job.request.seed],
	])
		details.append(text("dt", label), text("dd", value));
	const list = $("local-ai-artifacts");
	list.replaceChildren();
	for (const artifact of job.state === "succeeded" ? job.artifacts : []) {
		const item = document.createElement("li");
		const link = text("a", artifact.name + " 다운로드", "button");
		link.href =
			apiBase +
			"/local-ai/jobs/" +
			encodeURIComponent(job.id) +
			"/artifacts/" +
			encodeURIComponent(artifact.id);
		link.download = artifact.name;
		item.append(
			link,
			text("p", artifact.bytes + " bytes · SHA-256 " + artifact.sha256, "meta"),
		);
		list.append(item);
	}
}
async function refreshLocalAi() {
	if (!localAiAttempt || localAiPending) return;
	const authEpoch = epoch;
	localAiPending = true;
	updateLocalAi();
	try {
		const result = await request(
			"/local-ai/jobs/" + encodeURIComponent(localAiAttempt.requestId),
		);
		if (authEpoch === epoch) receiveLocalAi(result.job);
	} catch (error) {
		if (authEpoch === epoch)
			notice(
				"local-ai-status",
				"기존 UUID 상태 확인 실패: " +
					localAiAttempt.requestId +
					" · " +
					errorMessage(error) +
					". 재제출하지 않았습니다.",
				true,
			);
	} finally {
		if (authEpoch === epoch) {
			localAiPending = false;
			updateLocalAi();
		}
	}
}
$("local-ai-tool").addEventListener("change", localAiToolChanged);
for (const id of ["local-ai-asset", "local-ai-prompt", "local-ai-seed"])
	$(id).addEventListener("input", updateLocalAi);
$("local-ai-refresh-catalog").addEventListener("click", loadLocalAiCatalog);
$("local-ai-refresh").addEventListener("click", refreshLocalAi);
$("local-ai-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	updateLocalAi();
	if ($("local-ai-submit").disabled) return;
	const authEpoch = epoch;
	const payload = {
		requestId: crypto.randomUUID(),
		tool: $("local-ai-tool").value,
		assetId: $("local-ai-asset").value,
		seed: Number($("local-ai-seed").value),
	};
	if (payload.tool === "unimate") payload.prompt = $("local-ai-prompt").value;
	localAiAttempt = { ...payload, state: "unknown" };
	localAiPending = true;
	$("local-ai-artifacts").replaceChildren();
	$("local-ai-job").replaceChildren(
		text("dt", "작업 UUID"),
		text("dd", payload.requestId),
	);
	notice("local-ai-status", "제출 응답 확인 중 · " + payload.requestId);
	updateLocalAi();
	try {
		const result = await request("/local-ai/jobs", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (authEpoch === epoch) receiveLocalAi(result.job);
	} catch (error) {
		if (authEpoch === epoch)
			notice(
				"local-ai-status",
				"제출 결과 미확인 · " +
					payload.requestId +
					" · " +
					errorMessage(error) +
					". 기존 작업 상태를 확인하세요. 자동 재제출하지 않습니다.",
				true,
			);
	} finally {
		if (authEpoch === epoch) {
			localAiPending = false;
			updateLocalAi();
		}
	}
});

start();
fetch(`${apiBase}/status`, { credentials: "same-origin", cache: "no-store" })
	.then(async (response) => {
		if (!response.ok) throw new Error(`HTTP_${response.status}`);
		const status = await response.json();
		if (["local", "personal", "hosted"].includes(status.mode)) {
			loginMode = status.mode;
			if (!session) setLoginLink(loginMode);
		}
		notice(
			"service-message",
			status.ready === true
				? `서버 구성 준비됨 / 모델 ${status.model ?? "미확인"}`
				: status.ready === false
					? `서버 구성이 준비되지 않았습니다. ${Array.isArray(status.missingConfig) ? status.missingConfig.join(", ") : "구성 상태 미확인"}`
					: "서버 준비 상태 미확인",
		);
	})
	.catch((error) =>
		notice(
			"service-message",
			`서버 연결 상태를 확인하지 못했습니다: ${errorMessage(error)}`,
			true,
		),
	);
