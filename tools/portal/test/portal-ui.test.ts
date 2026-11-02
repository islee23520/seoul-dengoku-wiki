import { expect, test } from "bun:test";
import { createHash, webcrypto } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createContext, runInContext } from "node:vm";
import { parse } from "@babel/parser";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";
import { parseWorkstationRequest } from "../src/references.ts";
import {
	nativeMossCapability,
	nativeMossUIContract,
} from "./native-moss-browser-fixture.ts";
import { referencesFixture } from "./references-fixture.ts";

// Execute the shipped module against its actual HTML. Only browser primitives
// are supplied here; selection, verification and reset logic remain the client’s.
class Element {
	children: Element[] = [];
	parent: Element | null = null;
	attributes = new Map<string, string>();
	listeners = new Map<
		string,
		((event: { preventDefault(): void }) => unknown)[]
	>();
	dataset: Record<string, string> & {
		activeTask?: string;
		frameOrder?: string;
		identityResultId?: string;
		sha?: string;
		mode?: string;
		jobId?: string;
		kind?: string;
		personId?: string;
		reviewAuthority?: string;
		eligible?: string;
		requestId?: string;
		state?: string;
		view?: string;
	} = {};
	private content = "";
	private textListeners: (() => void)[] = [];
	get textContent() {
		return this.content;
	}
	set textContent(value: string) {
		this.content = value;
		for (const listener of this.textListeners.splice(0)) listener();
	}
	nextTextChange() {
		return new Promise<void>((resolve) => this.textListeners.push(resolve));
	}
	value = "";
	defaultValue = "";
	checked = false;
	defaultChecked = false;
	disabled = false;
	hidden = false;
	open = false;
	click() {
		return this.fire("click");
	}
	type = "";
	files: File[] = [];
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	imageLoad: (() => Promise<void>) | null = null;
	naturalWidth = 2;
	naturalHeight = 2;
	download = "";
	decodeError = false;
	decode() {
		return this.decodeError
			? Promise.reject(new Error("decode failed"))
			: Promise.resolve();
	}
	constructor(
		public tagName: string,
		public id = "",
	) {}
	get firstChild() {
		return this.children[0];
	}
	get isConnected(): boolean {
		return this.tagName === "document" || Boolean(this.parent?.isConnected);
	}
	set src(value: string) {
		this.attributes.set("src", value);
		const loaded = this.onload;
		const failed = this.onerror;
		queueMicrotask(async () => {
			try {
				await this.imageLoad?.();
				loaded?.();
			} catch {
				failed?.();
			}
		});
	}
	append(...nodes: Element[]) {
		for (const node of nodes) {
			node.parent = this;
			this.children.push(node);
			if (this.tagName === "select" && this.children.length === 1)
				this.value = node.value;
		}
	}
	prepend(node: Element) {
		node.parent = this;
		this.children.unshift(node);
	}
	replaceChildren(...nodes: Element[]) {
		for (const node of this.children) node.parent = null;
		this.children = [];
		this.append(...nodes);
	}
	setAttribute(key: string, value: string) {
		this.attributes.set(key, value);
	}
	getAttribute(key: string) {
		return this.attributes.get(key) ?? null;
	}
	get href() {
		return this.getAttribute("href") ?? "";
	}
	set href(value: string) {
		this.setAttribute("href", value);
	}
	removeAttribute(key: string) {
		this.attributes.delete(key);
	}
	focus() {}
	showModal() {
		this.open = true;
	}
	close() {
		this.open = false;
	}
	addEventListener(
		name: string,
		listener: (event: { preventDefault(): void }) => unknown,
	) {
		this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
	}
	async fire(name: string) {
		if (
			this.disabled ||
			this.ancestors().some(
				(node) => node.tagName === "fieldset" && node.disabled,
			)
		)
			return;
		await Promise.all(
			(this.listeners.get(name) ?? []).map((listener) =>
				listener({ preventDefault() {} }),
			),
		);
	}
	ancestors(): Element[] {
		return this.parent ? [this.parent, ...this.parent.ancestors()] : [];
	}
	querySelectorAll(selector: string): Element[] {
		return this.children.flatMap((node) => [
			...(node.tagName === selector ? [node] : []),
			...node.querySelectorAll(selector),
		]);
	}
	reset() {
		for (const node of this.querySelectorAll("input").concat(
			this.querySelectorAll("select"),
			this.querySelectorAll("textarea"),
		)) {
			node.value =
				node.defaultValue ||
				(node.tagName === "select" ? (node.firstChild?.value ?? "") : "");
			node.checked = node.defaultChecked;
		}
	}
}

const findDesc = (
	root: { children: unknown[] },
	pred: (el: any) => boolean,
): any => {
	for (const child of root.children as any[]) {
		if (pred(child)) return child;
		const nested = findDesc(child, pred);
		if (nested) return nested;
	}
	return null;
};

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}

async function client(
	network?: (url: string, options: RequestInit) => Promise<Response>,
	seedSession = true,
) {
	const html = await readFile(
		new URL("../public/index.html", import.meta.url),
		"utf8",
	);
	const source = await readFile(
		new URL("../public/portal.mjs", import.meta.url),
		"utf8",
	);
	parse(source, { sourceType: "module" });
	const document = new Element("document");
	const stack = [document];
	for (const token of html.matchAll(/<\/?([a-z][\w-]*)([^>]*)>/gi)) {
		const tag = (token[1] ?? "").toLowerCase();
		if (token[0].startsWith("</")) {
			if (stack.at(-1)?.tagName === tag) stack.pop();
			continue;
		}
		const node = new Element(tag);
		for (const attr of (token[2] ?? "").matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
			const [, key = "", value = ""] = attr;
			node.setAttribute(key, value);
			if (key === "id") node.id = value;
			if (key === "value") node.value = node.defaultValue = value;
			if (key === "disabled") node.disabled = true;
			if (key === "hidden") node.hidden = true;
		}
		stack.at(-1)?.append(node);
		if (!["meta", "link", "input", "img", "br"].includes(tag)) stack.push(node);
	}
	const all = (): Element[] => {
		const walk = (node: Element): Element[] => [
			node,
			...node.children.flatMap(walk),
		];
		return walk(document);
	};
	const byId = (id: string) => {
		const node = all().find((node) => node.id === id);
		if (!node) throw new Error(`Missing actual DOM ID ${id}`);
		return node;
	};
	const revoked: string[] = [];
	let urls = 0;
	const requests: string[] = [];
	const writes: { url: string; body: string }[] = [];
	const controls = new Map<string, ReturnType<typeof deferred<Response>>>();
	const arrivals = new Map<string, ReturnType<typeof deferred<void>>>();
	let decodeFailure = false;
	let imageWidth = 2;
	let imageHeight = 2;
	// Server job event stream stand-in: tests deliver one event explicitly; no
	// timers exist in this context, so a wait that depends on time cannot pass.
	const eventSources: { url: string; closed: boolean; onmessage: unknown }[] =
		[];
	class FakeEventSource {
		onmessage: ((event: { data: string }) => void) | null = null;
		closed = false;
		constructor(public url: string) {
			eventSources.push(this);
		}
		close() {
			this.closed = true;
		}
	}
	const context = createContext({
		EventSource: FakeEventSource,
		document: Object.assign(document, {
			documentElement: all().find((node) => node.tagName === "html"),
			getElementById: byId,
			createElement: (tag: string) => {
				const node = new Element(tag);
				node.naturalWidth = imageWidth;
				node.naturalHeight = imageHeight;
				if (tag === "img") node.decodeError = decodeFailure;
				return node;
			},
			querySelector: (selector: string) =>
				all().find(
					(node) =>
						node.tagName === "label" &&
						node.getAttribute("for") === selector.match(/for="([^"]+)"/)?.[1],
				),
			dispatchEvent() {},
		}),
		Headers,
		AbortController,
		Blob,
		TextEncoder,
		TextDecoder,
		Uint8Array,
		Date,
		Error,
		console,
		atob,
		btoa,
		queueMicrotask,
		crypto: webcrypto,
		structuredClone,
		URL: Object.assign(class extends URL {}, {
			createObjectURL: () => `blob:test-${++urls}`,
			revokeObjectURL: (url: string) => revoked.push(url),
		}),
		URLSearchParams,
		matchMedia: () => ({ matches: false, addEventListener() {} }),
		addEventListener() {},
		fetch: (url: string, options: RequestInit & { body?: string }) => {
			requests.push(url);
			if (options?.method === "POST")
				writes.push({ url, body: options.body ?? "" });
			arrivals.get(url.replace("/tools/api", ""))?.resolve();
			if (
				network &&
				!["/tools/api/auth/session", "/tools/api/status"].includes(url)
			)
				return network(url, options);
			const control = controls.get(url.replace("/tools/api", ""));
			if (!control) throw new Error(`Unexpected request ${url}`);
			return control.promise.then((response) => response.clone());
		},
	});
	// Hold startup without populating protected state; tests initialize through the
	// VM lexical environment, never by injecting production exports.
	controls.set("/auth/session", deferred());
	controls.set("/status", deferred());
	runInContext(source, context);
	const evaluate = (code: string) => runInContext(code, context);
	if (seedSession)
		evaluate('session = {user:{id:"1",login:"fixture"}, csrfToken:"fixture"};');
	const response = (path: string, body: unknown) => {
		const control = deferred<Response>();
		control.resolve(Response.json(body));
		controls.set(path, control);
	};
	const hold = (path: string) => {
		const control = deferred<Response>();
		controls.set(path, control);
		const arrived = deferred<void>();
		arrivals.set(path, arrived);
		return { ...control, requested: arrived.promise };
	};
	const bytes = new Uint8Array([137, 80, 78, 71]);
	const pngSHA = createHash("sha256").update(bytes).digest("hex");
	const result = (id: string) => ({
		schema: "portal-generated-result.v1",
		ownerId: "1",
		jobId: id,
		batchId: "batch",
		itemId: id,
		snapshotSHA: "a".repeat(64),
		pngSHA,
		receiptSHA: "b".repeat(64),
		imageUrl: `/tools/api/jobs/${id}/image`,
		reviewStatus: "HOLD",
		approval: "NONE",
		machineEvidence: {
			schema: "portal-result-metrics.v1",
			pngSHA,
			receiptSHA: "b".repeat(64),
			metricsSHA: "c".repeat(64),
		},
	});
	const prepare = (id: string) => {
		response(`/jobs/${id}/captured-source`, { source: captured(id) });
		response(`/jobs/${id}`, {
			job: { id, state: "HOLD", imageUrl: `/tools/api/jobs/${id}/image` },
		});
		const image = deferred<Response>();
		image.resolve(
			new Response(bytes, { headers: { "Content-Type": "image/png" } }),
		);
		controls.set(`/jobs/${id}/image`, image);
		response(`/jobs/${id}/result`, { result: result(id) });
		response(`/jobs/${id}/evaluations`, {
			resultBinding: result(id),
			machineEvidence: result(id).machineEvidence,
			latest: null,
			history: [],
		});
	};
	const captured = (id: string) => ({
		schema: "portal-captured-source.v1",
		ownerId: "1",
		jobId: id,
		batchId: "batch",
		itemId: id,
		snapshotSHA: "a".repeat(64),
		imageSHA: pngSHA,
		imageBase64: Buffer.from(bytes).toString("base64"),
		identity: {
			personId: "person",
			characterId: "character",
			name: "Same historical name",
		},
	});
	const select = (id: string) =>
		evaluate(
			`selectBatchResult({jobId:${JSON.stringify(id)}, requestId:${JSON.stringify(id)}, itemId:${JSON.stringify(id)}, snapshotSHA:"${"a".repeat(64)}", name:${JSON.stringify(id)}, characterId:"character"}, "batch")`,
		);
	evaluate('activeBatch = {batchId:"batch",state:"COMPLETED",items:[]};');
	return {
		resolveStartup: (
			path: "/auth/session" | "/status",
			body: unknown,
			status = 200,
		) => controls.get(path)?.resolve(Response.json(body, { status })),
		captured,
		failDecode: () => {
			decodeFailure = true;
		},
		byId,
		evaluate,
		response,
		hold,
		prepare,
		select,
		requests,
		writes,
		revoked,
		result,
		bytes,
		pngSHA,
		imageSize: (width: number, height: number) => {
			imageWidth = width;
			imageHeight = height;
		},
		jobEvents: {
			open: () => eventSources.filter((source) => !source.closed).length,
			emit: () => {
				for (const source of eventSources)
					if (!source.closed && typeof source.onmessage === "function")
						source.onmessage({ data: "changed" });
			},
		},
	};
}

test("Comfy readiness panel keeps credentialed connection and rejects misleading success", async () => {
	// Given actual client DOM and an explicitly available server workflow.
	const ui = await client();
	const workflow = "zimage-turbo-text-draft.v1";
	ui.response("/connections", {
		endpoints: [],
		connection: {
			connectionId: "credentialed",
			state: "READY",
			endpointId: "local-openai",
			expiresAt: Date.now() + 60000,
		},
		comfyui: {
			available: true,
			workflows: [
				{
					id: workflow,
					label: "Draft",
					providerModel: `comfyui:${workflow}`,
					limitations: "draft",
				},
			],
			connection: null,
			readiness: null,
		},
	});
	await ui.evaluate("activeBatch = null; loadConnections()");
	expect(ui.byId("comfy-connection-panel").hidden).toBe(false);
	expect(ui.byId("comfy-connect").disabled).toBe(false);
	// When a successful HTTP body fails the readiness protocol contract.
	ui.response("/connections", {
		connection: { connectionId: "fake", state: "READY" },
		readiness: null,
	});
	await ui.byId("comfy-connect").fire("click");
	// Then it is an alert, never a ready Comfy connection or generation dispatch.
	expect(ui.byId("comfy-status").getAttribute("role")).toBe("alert");
	expect(ui.evaluate("comfyConnection")).toBeNull();
	expect(ui.evaluate("connection.connectionId")).toBe("credentialed");
	expect(ui.writes.map((entry) => entry.url)).toEqual([
		"/tools/api/connections",
	]);
});

test("Comfy canvas link follows configured URL independently of connection readiness", async () => {
	const ui = await client();
	const link = ui.byId("comfy-canvas-link");
	expect(link.hidden).toBe(true);
	expect(link.getAttribute("target")).toBe("_blank");
	expect(link.getAttribute("rel")).toBe("noopener");
	for (const comfyui of [
		{ available: true, canvasUrl: "http://100.77.98.25:8188/comfyart/" },
		{ available: true },
		{ available: false, canvasUrl: "http://100.77.98.25:8188/comfyart/" },
		{ available: true, canvasUrl: "http://100.77.98.25:8188/comfyart/" },
	]) {
		ui.response("/connections", { endpoints: [], connection: null, comfyui });
		await ui.evaluate("loadConnections()");
		const visible = comfyui.available && Boolean(comfyui.canvasUrl);
		expect(link.hidden).toBe(!visible);
		expect(link.getAttribute("href")).toBe(
			visible ? (comfyui.canvasUrl ?? null) : null,
		);
		expect(ui.evaluate("comfyConnection")).toBeNull();
	}
	ui.evaluate("clearProtected()");
	expect(link.hidden).toBe(true);
	expect(link.getAttribute("href")).toBeNull();
	expect(ui.writes).toHaveLength(0);
});

test("Comfy pending readiness cannot restore state after logout", async () => {
	// Given a pending readiness request from the current authentication epoch.
	const ui = await client();
	const workflow = "moss-image-sft-text.alpha.v1";
	ui.evaluate(
		`activeBatch = null; comfyAvailable = true; comfyWorkflows = [{id:${JSON.stringify(workflow)},label:"Draft"}]; renderComfyConnection()`,
	);
	const pending = ui.hold("/connections");
	const clicking = ui.byId("comfy-connect").fire("click");
	await pending.requested;
	// When the session ends before a valid response arrives.
	ui.evaluate("clearProtected()");
	pending.resolve(
		Response.json({
			connection: {
				connectionId: "old",
				state: "READY",
				protocolVersion: "comfyui-http.v1",
				toolName: workflow,
			},
			readiness: { state: "READY" },
		}),
	);
	await clicking;
	// Then protected readiness stays cleared and no second write occurs.
	expect(ui.evaluate("comfyConnection")).toBeNull();
	expect(ui.byId("comfy-connection-panel").hidden).toBe(true);
	expect(ui.writes).toHaveLength(1);
});

test("account provider form uses the server catalog and saves masked model state", async () => {
	const ui = await client();
	ui.response("/connections/account", {
		login: "fixture",
		connected: true,
		baseUrl: "https://cpa.example/v1",
		model: "gemini-3.1-flash-image",
		models: [
			{ id: "gpt-image-2.5-sunburst", label: "GPT 이미지" },
			{ id: "gemini-3.1-flash-image", label: "Gemini 이미지" },
			{ id: "grok-imagine-image", label: "Grok 이미지" },
		],
	});
	ui.response("/connections", { endpoints: [], connection: null });
	await ui.evaluate("loadAccountProvider()");
	expect(
		ui.byId("account-provider-model").children.map((node) => node.value),
	).toEqual([
		"gpt-image-2.5-sunburst",
		"gemini-3.1-flash-image",
		"grok-imagine-image",
	]);
	expect(ui.byId("account-provider-model").value).toBe(
		"gemini-3.1-flash-image",
	);
	expect(ui.byId("account-provider-key").value).toBe("");
	ui.byId("account-provider-key").value = "ui-secret";
	await ui.evaluate('saveAccountProvider("POST")');
	expect(JSON.parse(ui.writes[0]?.body ?? "{}")).toEqual({
		baseUrl: "https://cpa.example/v1",
		apiKey: "ui-secret",
		model: "gemini-3.1-flash-image",
	});
	expect(ui.byId("account-provider-key").value).toBe("");
	expect(ui.byId("account-provider-status").textContent).not.toContain(
		"ui-secret",
	);
	ui.response("/connections/account", {
		login: "fixture",
		connected: false,
		models: [],
	});
	await ui.evaluate('saveAccountProvider("DELETE")');
	expect(ui.byId("account-provider-disconnect").disabled).toBe(true);
});

test("login link stays safe while session is deferred and selects OAuth only for hosted mode", async () => {
	const personal = await client(undefined, false);
	const personalLink = personal.byId("login");
	expect(personalLink.getAttribute("href")).toBe("/tools/");
	expect(personalLink.getAttribute("href")).not.toBe("/tools/api/auth/login");
	const personalStatus = personal.byId("service-message").nextTextChange();
	personal.resolveStartup("/status", { mode: "personal", ready: true });
	await personalStatus;
	expect(personalLink.getAttribute("href")).toBe("/tools/");
	const personalFailure = personal.byId("session-message").nextTextChange();
	personal.resolveStartup(
		"/auth/session",
		{ error: { code: "ACCESS_REQUIRED" } },
		401,
	);
	await personalFailure;
	expect(personalLink.getAttribute("href")).toBe("/tools/");

	const hosted = await client(undefined, false);
	const hostedLink = hosted.byId("login");
	expect(hostedLink.getAttribute("href")).toBe("/tools/");
	const hostedStatus = hosted.byId("service-message").nextTextChange();
	hosted.resolveStartup("/status", { mode: "hosted", ready: true });
	await hostedStatus;
	expect(hostedLink.getAttribute("href")).toBe("/tools/api/auth/login");
	const hostedFailure = hosted.byId("session-message").nextTextChange();
	hosted.resolveStartup(
		"/auth/session",
		{ error: { code: "AUTHENTICATION_REQUIRED" } },
		401,
	);
	await hostedFailure;
	expect(hostedLink.getAttribute("href")).toBe("/tools/api/auth/login");
});

function wikiPerson(id: string, eligible = true) {
	return {
		personId: id,
		characterId: `K${id}`,
		name: id,
		detail: { personId: id },
		token: { generationContract: { model: "gpt-image-2.5" } },
		source: { kind: "live-wiki-http", sha256: "d".repeat(64) },
		generationEligibility: {
			eligible,
			originalSourceHashes: {
				detail: "a".repeat(64),
				token: "b".repeat(64),
				image: "c".repeat(64),
			},
		},
	};
}

const workstationCategories = [
	"portrait",
	"fullbody-turntable",
	"torso",
	"detached-head",
	"head-without-hair-eyes-teeth",
	"hair",
	"underwear-only-torso",
];
async function workstationClient() {
	const ui = await client();
	ui.response("/v2/workstations/catalog", {
		schema: "portal-workstation-catalog.v2",
		categories: workstationCategories,
		productionGeneration: "BLOCKED_SINGLE_ATTEMPT_NOT_PROVED",
		paidProof: "NOT_RUN",
	});
	ui.response("/references", {
		catalog: { styleReferenceSha256: "a".repeat(64) },
	});
	ui.response("/characters", {
		characters: [
			{ personId: "person-1017", characterId: "K1017", name: "Controlled" },
		],
	});
	await ui.evaluate("loadWorkstations()");
	ui.evaluate(
		`workstationSource = {personId:"person-1017", characterId:"K1017", token:{lookId:"authored-look"}, sourceHashes:{detail:"${"a".repeat(64)}",token:"${"b".repeat(64)}",image:"${"c".repeat(64)}"}, eligible:true}; workstationIdentity = {resultId:"11111111-1111-4111-8111-111111111111",personId:"person-1017",pngSHA:"${"d".repeat(64)}",faceMode:{kind:"unique",variantId:null}}; connection = {connectionId:"22222222-2222-4222-8222-222222222222", state:"READY", expiresAt:Date.now()+60000};`,
	);
	ui.byId("workstation-person").value = "person-1017";
	ui.byId("workstation-category").value = "hair";
	return ui;
}
function authorWorkstation(ui: Awaited<ReturnType<typeof client>>) {
	for (const [key, value] of Object.entries({
		"source-id": "owner-design",
		description: "Owner authored blue hair design.",
		width: "48",
		height: "64",
		background: "transparent",
		canvas: "owner-canvas",
		"anchor-x": "24",
		"anchor-y": "32",
		left: "0",
		top: "0",
		right: "48",
		bottom: "64",
	}))
		ui.byId(`workstation-${key}`).value = value;
}
test("v2 workstations require explicit fields and derive only category invariants", async () => {
	const ui = await workstationClient();
	expect(ui.byId("workstation-category").children.map((n) => n.value)).toEqual([
		"",
		...workstationCategories,
	]);
	await expect(ui.evaluate("workstationEnvelope()")).rejects.toThrow();
	expect(ui.writes).toHaveLength(0);
	authorWorkstation(ui);
	for (const category of workstationCategories) {
		ui.byId("workstation-category").value = category;
		const envelope = await ui.evaluate("workstationEnvelope()");
		const parsed = parseWorkstationRequest(envelope.request);
		expect(parsed.frames).toHaveLength(
			category === "fullbody-turntable" ? 4 : 1,
		);
		expect(parsed.frames[0]?.outputSpec.width).toBe(48);
		expect(parsed.frames.map((f) => f.outputSpec.view)).toEqual(
			category === "fullbody-turntable"
				? ["front", "profile", "side", "back"]
				: [category === "portrait" ? "viewer-right" : "front"],
		);
		const look = JSON.parse(
			Buffer.from(envelope.authoredLookBase64, "base64").toString(),
		);
		expect(look.lookId).toBe("owner-design");
		expect(parsed.sourceBinding?.schemaVersion).toBe(2);
		expect(look.category).toBe(category);
		expect(
			createHash("sha256")
				.update(Buffer.from(envelope.authoredLookBase64, "base64"))
				.digest("hex"),
		).toBe(parsed.authoredLook.sha256);
	}
	ui.byId("workstation-width").value = "";
	await expect(ui.evaluate("workstationEnvelope()")).rejects.toThrow();
	ui.byId("workstation-width").value = "48";
	ui.byId("workstation-anchor-x").value = "48";
	await expect(ui.evaluate("workstationEnvelope()")).rejects.toThrow();
	expect(ui.writes).toHaveLength(0);
});
test("full-body turntable entry locks four ordered PNG views and filters persisted history", async () => {
	const ui = await workstationClient();
	ui.byId("workspace").hidden = false;
	await ui.byId("task-turntable").click();
	expect(ui.byId("workstation-title").textContent).toBe(
		"전신 턴테이블 이미지 작업대",
	);
	expect(ui.byId("turntable-directions").hidden).toBe(false);
	expect(ui.byId("workstation-category-field").hidden).toBe(true);
	expect(ui.byId("workstation-category").value).toBe("fullbody-turntable");
	expect(ui.byId("create-workstation").textContent).toBe(
		"전신 4방향 PNG 한 번 요청",
	);
	authorWorkstation(ui);
	const envelope = await ui.evaluate("workstationEnvelope()");
	const parsed = parseWorkstationRequest(envelope.request);
	expect(parsed.frames.map((frame) => frame.outputSpec.view)).toEqual([
		"front",
		"profile",
		"side",
		"back",
	]);
	ui.response("/v2/workstations/person-1017/history", {
		schema: "portal-workstation-history.v2",
		items: [
			{
				job: { id: parsed.requestId, state: "HOLD" },
				request: parsed,
			},
			{
				job: { id: "33333333-3333-4333-8333-333333333333", state: "HOLD" },
				request: {
					...parsed,
					requestId: "33333333-3333-4333-8333-333333333333",
					frames: parsed.frames.slice(0, 1).map((frame) => ({
						...frame,
						outputSpec: {
							...frame.outputSpec,
							category: "hair",
							view: "front",
						},
					})),
				},
			},
		],
	});
	await ui.evaluate("loadWorkstationHistory()");
	expect(ui.byId("workstation-history").children).toHaveLength(1);
	expect(ui.byId("workstation-history").children[0]?.textContent).toContain(
		"전신 턴테이블",
	);
	expect(ui.byId("workstation-history-status").textContent).toContain(
		"1개 전신 턴테이블 보관 작업",
	);
	ui.byId("workstation-category").value = "hair";
	await ui.byId("task-parts").click();
	await ui.evaluate("loadWorkstationHistory()");
	expect(ui.byId("workstation-history").children).toHaveLength(2);
	await ui.byId("task-turntable").click();
	await ui.evaluate("loadWorkstationHistory()");
	expect(ui.byId("workstation-history").children).toHaveLength(1);
});
test("torso workstation fixes the categorized image-only contract", async () => {
	const ui = await workstationClient();
	ui.byId("workspace").hidden = false;
	await ui.byId("task-torso").click();
	expect(ui.byId("task-torso").getAttribute("aria-current")).toBe("page");
	expect(ui.byId("task-title").textContent).toBe("몸통 참조");
	expect(ui.byId("workstation-category").value).toBe("torso");
	expect(ui.byId("workstation-category").disabled).toBe(true);
	expect(ui.byId("workstation-workflow-note").textContent).toContain(
		"등록 원본 인물",
	);
	authorWorkstation(ui);
	const envelope = await ui.evaluate("workstationEnvelope()");
	const parsed = parseWorkstationRequest(envelope.request);
	expect(parsed.personId).toBe("person-1017");
	expect(parsed.identityResultId).toBe("11111111-1111-4111-8111-111111111111");
	expect(parsed.styleReferenceSha256).toBe("a".repeat(64));
	expect(parsed.frames).toHaveLength(1);
	expect(parsed.frames[0]?.outputSpec).toMatchObject({
		category: "torso",
		variant: "complete",
		view: "front",
		format: "png",
		featureExclusions: [],
	});
});
test("detached head workstation preserves identity and transparent alignment metadata", async () => {
	const ui = await workstationClient();
	ui.byId("workspace").hidden = false;
	await ui.byId("task-detached-head").click();
	expect(ui.byId("task-detached-head").getAttribute("aria-current")).toBe(
		"page",
	);
	expect(ui.byId("task-title").textContent).toBe("분리된 머리 참조");
	expect(ui.byId("workstation-category").value).toBe("detached-head");
	expect(ui.byId("workstation-category").disabled).toBe(true);
	expect(ui.byId("workstation-workflow-note").textContent).toContain(
		"메시·분리 형상을 생성하지 않습니다",
	);
	authorWorkstation(ui);
	const envelope = await ui.evaluate("workstationEnvelope()");
	const parsed = parseWorkstationRequest(envelope.request);
	expect(Reflect.get(parsed, "personId")).toBe("person-1017");
	expect(Reflect.get(parsed, "identityResultId")).toBe(
		"11111111-1111-4111-8111-111111111111",
	);
	expect(parsed.sourceBinding).toMatchObject({
		schemaVersion: 2,
		ownerId: "1",
		characterId: "K1017",
		identityPngSHA: "d".repeat(64),
	});
	expect(parsed.frames).toHaveLength(1);
	expect(parsed.frames[0]?.outputSpec).toMatchObject({
		category: "detached-head",
		variant: "complete",
		view: "front",
		format: "png",
		background: { kind: "transparent", alpha: "zero-background" },
		alignment: {
			canvasId: "owner-canvas",
			coordinates: "pixels-top-left-x-right-y-down",
			anchor: [24, 32],
			crop: [0, 0, 48, 64],
		},
		featureExclusions: [],
	});
	expect(ui.writes).toHaveLength(0);
});
test("excluded head entry keeps its source and variant separate from complete head and hair", async () => {
	const ui = await workstationClient();
	ui.byId("workspace").hidden = false;
	await ui.byId("task-head-without-hair-eyes-teeth").click();
	expect(
		ui.byId("task-head-without-hair-eyes-teeth").getAttribute("aria-current"),
	).toBe("page");
	expect(ui.byId("workstation-category").value).toBe(
		"head-without-hair-eyes-teeth",
	);
});

test("separate hair workstation binds one transparent hair frame and isolates its history", async () => {
	const ui = await workstationClient();
	ui.byId("workspace").hidden = false;
	await ui.byId("task-hair").click();
	expect(ui.byId("task-hair").getAttribute("aria-current")).toBe("page");
	expect(ui.byId("workstation-workspace").hidden).toBe(false);
	expect(ui.byId("workstation-category").value).toBe("hair");
	expect(ui.byId("workstation-category").disabled).toBe(true);
	authorWorkstation(ui);
	const envelope = await ui.evaluate("workstationEnvelope()");
	const parsed = parseWorkstationRequest(envelope.request);
	expect(parsed.personId).toBe("person-1017");
	expect(parsed.identityResultId).toBe("11111111-1111-4111-8111-111111111111");
	expect(parsed.styleReferenceSha256).toBe("a".repeat(64));
	expect(parsed.sourceBinding).toMatchObject({
		ownerId: "1",
		characterId: "K1017",
		originalHashes: {
			detail: "a".repeat(64),
			token: "b".repeat(64),
			image: "c".repeat(64),
		},
		identityPngSHA: "d".repeat(64),
	});
	expect(parsed.frames).toHaveLength(1);
	expect(parsed.frames[0]?.outputSpec).toMatchObject({
		category: "hair",
		variant: "complete",
		view: "front",
		format: "png",
		background: { kind: "transparent", alpha: "zero-background" },
		alignment: {
			canvasId: "owner-canvas",
			anchor: [24, 32],
			crop: [0, 0, 48, 64],
		},
	});
	const look = JSON.parse(
		Buffer.from(envelope.authoredLookBase64, "base64").toString(),
	);
	expect(look.category).toBe("hair");
	ui.byId("workstation-background").value = "solid";
	await expect(ui.evaluate("workstationEnvelope()")).rejects.toThrow();
	const otherId = "33333333-3333-4333-8333-333333333333";
	ui.response("/v2/workstations/person-1017/history", {
		schema: "portal-workstation-history.v2",
		items: [
			{ job: { id: parsed.requestId, state: "HOLD" }, request: parsed },
			{
				job: { id: otherId, state: "HOLD" },
				request: {
					...parsed,
					requestId: otherId,
					frames: parsed.frames.map((frame) => ({
						...frame,
						outputSpec: { ...frame.outputSpec, category: "detached-head" },
					})),
				},
			},
		],
	});
	await ui.evaluate("loadWorkstationHistory()");
	expect(ui.byId("workstation-history").children).toHaveLength(1);
	expect(ui.byId("workstation-history").children[0]?.dataset.jobId).toBe(
		parsed.requestId,
	);
	await ui.byId("task-parts").click();
	await ui.evaluate("loadWorkstationHistory()");
	expect(ui.byId("workstation-history").children).toHaveLength(2);
	expect(ui.writes).toHaveLength(0);
});
test("v2 production rejection stays BLOCKED without synthetic completion or retry", async () => {
	const ui = await workstationClient();
	await ui.byId("task-head-without-hair-eyes-teeth").click();
	authorWorkstation(ui);
	const send = ui.hold("/v2/workstations");
	send.resolve(
		Response.json(
			{ error: { code: "REFERENCE_PRODUCTION_BLOCKED" } },
			{ status: 503 },
		),
	);
	await ui.evaluate("submitWorkstation()");
	expect(ui.byId("workstation-status").dataset.state).toBe("BLOCKED");
	expect(ui.writes).toHaveLength(1);
	expect(ui.byId("workstation-frames").children).toHaveLength(0);
	ui.evaluate("clearProtected()");
	expect(ui.byId("workstation-person").children).toHaveLength(0);
	expect(ui.evaluate("workstationIdentity")).toBeNull();
});

test("v2 stale source and identity reads cannot repopulate after logout", async () => {
	const ui = await workstationClient();
	const source = ui.hold("/characters/person-1017");
	ui.response("/wiki/people/person-1017", {
		personId: "person-1017",
		characterId: "K1017",
		generationEligibility: { eligible: true },
	});
	ui.response("/jobs", { history: [] });
	ui.response("/v2/workstations/person-1017/history", {
		schema: "portal-workstation-history.v2",
		items: [],
	});
	const selecting = ui.evaluate("selectWorkstationPerson()");
	await source.requested;
	ui.evaluate("clearProtected()");
	source.resolve(
		Response.json({
			personId: "person-1017",
			characterId: "K1017",
			token: { lookId: "test-look" },
		}),
	);
	await selecting;
	expect(ui.evaluate("workstationSource")).toBeNull();
	expect(ui.byId("workstation-identity").children).toHaveLength(0);
	expect(ui.writes).toHaveLength(0);
});

test("v2 unknown response locks resubmission and mismatched identity stays unavailable", async () => {
	const ui = await workstationClient();
	ui.byId("workstation-identity").value =
		"11111111-1111-4111-8111-111111111111";
	ui.response("/references/identities/11111111-1111-4111-8111-111111111111", {
		identity: {
			resultId: "11111111-1111-4111-8111-111111111111",
			personId: "person-9999",
			pngSHA: "a".repeat(64),
		},
	});
	await ui.evaluate("selectWorkstationIdentity()");
	expect(ui.evaluate("workstationIdentity")).toBeNull();
	expect(ui.byId("create-workstation").disabled).toBe(true);
	ui.evaluate(
		`workstationIdentity={resultId:"11111111-1111-4111-8111-111111111111",personId:"person-1017",pngSHA:"${"d".repeat(64)}",faceMode:{kind:"unique",variantId:null}}`,
	);
	authorWorkstation(ui);
	const response = ui.hold("/v2/workstations");
	response.resolve(Response.json({ job: { state: "HOLD", id: "wrong" } }));
	await ui.evaluate("submitWorkstation()");
	expect(ui.byId("workstation-status").dataset.state).toBe("UNKNOWN");
	await ui.evaluate("submitWorkstation()");
	expect(ui.writes).toHaveLength(1);
	expect(ui.evaluate("ownerBlocked")).toBe(true);
});

test("v2 HTTP client binds owner sources and reads five indexed images offline", async () => {
	const f = await referencesFixture({ legacyToken: true });
	let sends = 0;
	const provider = createServer(async (req, res) => {
		if (req.method === "GET") {
			res.end(JSON.stringify({ data: [{ id: "gpt-image-2.5-sunburst" }] }));
			return;
		}
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const form = await new Response(Buffer.concat(chunks), {
			headers: { "content-type": req.headers["content-type"] ?? "" },
		}).formData();
		expect(req.url).toBe("/v2/images/edits");
		expect(form.get("size")).toBe("1024x1536");
		expect(form.get("output_format")).toBe("png");
		expect(form.get("background")).toBe("transparent");
		sends += 1;
		res.setHeader("content-type", "application/json");
		res.end(
			JSON.stringify({ data: [{ b64_json: f.image.toString("base64") }] }),
		);
	});
	const listening = once(provider, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	provider.listen(0, "127.0.0.1");
	await listening;
	const address = provider.address();
	if (!address || typeof address === "string") throw Error("address");
	try {
		await fetch(
			`${f.origin}/tools/api/connections/${f.payload().connectionId}`,
			{ method: "DELETE", headers: f.headers },
		);
		const connected = await (
			await f.request("/connections", {
				baseUrl: `http://127.0.0.1:${address.port}/v2`,
				apiKey: "controlled",
			})
		).json();
		const ui = await client((url, options) =>
			fetch(f.origin + url, {
				...options,
				headers: {
					...f.headers,
					...Object.fromEntries(new Headers(options.headers)),
				},
			}),
		);
		ui.imageSize(1024, 1536);
		ui.evaluate(
			`session.csrfToken=${JSON.stringify(f.headers["x-csrf-token"])}; connection=(${JSON.stringify(connected)}).connection;`,
		);
		await ui.evaluate("loadWorkstations()");
		ui.byId("workstation-person").value = f.person.id;
		await ui.byId("workstation-person").fire("change");
		expect(ui.evaluate("workstationSource.eligible")).toBe(true);
		expect(
			ui.byId("workstation-identity").children.map((n) => n.value),
		).toContain(f.identityResultId);
		ui.byId("workstation-identity").value = f.identityResultId;
		await ui.byId("workstation-identity").fire("change");
		expect(ui.evaluate("workstationIdentity.resultId")).toBe(
			f.identityResultId,
		);
		ui.byId("workstation-category").value = "torso";
		await ui.evaluate("submitWorkstation()");
		expect(sends).toBe(0);
		ui.byId("workstation-category").value = "detached-head";
		authorWorkstation(ui);
		for (const [key, value] of Object.entries({
			width: "1024",
			height: "1536",
			"anchor-x": "512",
			"anchor-y": "768",
			right: "1024",
			bottom: "1536",
		}))
			ui.byId(`workstation-${key}`).value = value;
		await ui.evaluate("submitWorkstation()");
		expect(ui.byId("workstation-status").dataset.state).toBe("HOLD");
		expect(sends).toBe(1);
		ui.byId("workstation-category").value = "fullbody-turntable";
		await ui.evaluate("submitWorkstation()");
		expect(sends).toBe(5);
		expect(ui.byId("workstation-history").children).toHaveLength(2);
		const closed = once(provider, "close");
		provider.close();
		provider.closeAllConnections();
		await closed;
		for (const button of ui.byId("workstation-history").children) {
			await button.click();
			const group = ui.byId("workstation-frames").children[0];
			expect(group?.dataset).toMatchObject({
				personId: f.person.id,
				jobId: button.dataset.jobId,
				identityResultId: f.identityResultId,
			});
			const frames = group?.querySelectorAll("li") ?? [];
			expect(frames).toHaveLength(
				button.textContent.includes("턴테이블") ? 4 : 1,
			);

			if (button.textContent.includes("몸통")) {
				const framesRoot = ui.byId("workstation-frames");
				const figcaption = findDesc(
					framesRoot,
					(el: any) => el.tagName === "figcaption",
				);
				expect(figcaption?.textContent).toContain("스타일 SHA");
				expect(figcaption?.textContent).toContain(f.person.id);
				const anchorEl = findDesc(framesRoot, (el: any) => el.tagName === "a");
				expect(anchorEl?.textContent).toBe("front PNG 다운로드");
				expect(anchorEl?.download).toContain("-torso-");
			}
			if (button.textContent.includes("분리된 머리")) {
				const framesRoot = ui.byId("workstation-frames");
				const figcaption = findDesc(
					framesRoot,
					(el: any) => el.tagName === "figcaption",
				);
				expect(figcaption?.textContent).toContain("배경 transparent alpha 0");
				expect(figcaption?.textContent).toContain(
					"정렬 owner-canvas / anchor 512,768 / crop 0,0,1024,1536",
				);
				const anchorEl = findDesc(framesRoot, (el: any) => el.tagName === "a");
				expect(anchorEl?.download).toContain("-detached-head-");
			}
			if (button.textContent.includes("턴테이블")) {
				expect(frames.map((frame) => frame.dataset.frameOrder)).toEqual([
					"0",
					"1",
					"2",
					"3",
				]);
				expect(frames.map((frame) => frame.dataset.view)).toEqual([
					"front",
					"profile",
					"side",
					"back",
				]);
				expect(
					new Set(frames.map((frame) => frame.dataset.requestId)).size,
				).toBe(4);
				expect(
					frames.map(
						(frame) =>
							findDesc(frame, (el: any) => el.tagName === "a")?.download,
					),
				).toEqual(
					["front", "profile", "side", "back"].map(
						(view) =>
							`${f.person.id}-fullbody-turntable-${button.dataset.jobId}-${view}.png`,
					),
				);
			}
		}
		const reloaded = await client((url, options) =>
			fetch(f.origin + url, {
				...options,
				headers: {
					...f.headers,
					...Object.fromEntries(new Headers(options.headers)),
				},
			}),
		);
		reloaded.byId("workstation-person").value = f.person.id;
		await reloaded.evaluate("loadWorkstationHistory()");
		expect(reloaded.byId("workstation-history").children).toHaveLength(2);
		expect(sends).toBe(5);
		const noCsrf = await fetch(`${f.origin}/tools/api/v2/workstations`, {
			method: "POST",
			headers: {
				cookie: f.cookie,
				origin: f.origin,
				"content-type": "application/json",
			},
			body: "{}",
		});
		expect(noCsrf.status).toBe(403);
		expect(
			(await f.request("/v2/workstations/person-9999/history")).status,
		).toBe(200);
		expect(sends).toBe(5);
	} finally {
		if (provider.listening) {
			const closed = once(provider, "close");
			provider.close();
			provider.closeAllConnections();
			await closed;
		}
		await f.close();
	}
}, 30000);

test("v2 HTTP client binds owner sources and reads five indexed images offline: head-without-hair-eyes-teeth", async () => {
	const f = await referencesFixture({ legacyToken: true });
	let sends = 0;
	const provider = createServer(async (req, res) => {
		if (req.method === "GET") {
			res.end(JSON.stringify({ data: [{ id: "gpt-image-2.5-sunburst" }] }));
			return;
		}
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const form = await new Response(Buffer.concat(chunks), {
			headers: { "content-type": req.headers["content-type"] ?? "" },
		}).formData();
		expect(req.url).toBe("/v2/images/edits");
		expect(form.get("size")).toBe("1024x1536");
		expect(form.get("output_format")).toBe("png");
		expect(form.get("background")).toBe("transparent");
		sends += 1;
		res.setHeader("content-type", "application/json");
		res.end(
			JSON.stringify({ data: [{ b64_json: f.image.toString("base64") }] }),
		);
	});
	const listening = once(provider, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	provider.listen(0, "127.0.0.1");
	await listening;
	const address = provider.address();
	if (!address || typeof address === "string") throw Error("address");
	try {
		await fetch(
			`${f.origin}/tools/api/connections/${f.payload().connectionId}`,
			{ method: "DELETE", headers: f.headers },
		);
		const connected = await (
			await f.request("/connections", {
				baseUrl: `http://127.0.0.1:${address.port}/v2`,
				apiKey: "controlled",
			})
		).json();
		const ui = await client((url, options) =>
			fetch(f.origin + url, {
				...options,
				headers: {
					...f.headers,
					...Object.fromEntries(new Headers(options.headers)),
				},
			}),
		);
		ui.imageSize(1024, 1536);
		ui.evaluate(
			`session.csrfToken=${JSON.stringify(f.headers["x-csrf-token"])}; connection=(${JSON.stringify(connected)}).connection;`,
		);
		await ui.evaluate("loadWorkstations()");
		ui.byId("workstation-person").value = f.person.id;
		await ui.byId("workstation-person").fire("change");
		expect(ui.evaluate("workstationSource.eligible")).toBe(true);
		expect(
			ui.byId("workstation-identity").children.map((n) => n.value),
		).toContain(f.identityResultId);
		ui.byId("workstation-identity").value = f.identityResultId;
		await ui.byId("workstation-identity").fire("change");
		expect(ui.evaluate("workstationIdentity.resultId")).toBe(
			f.identityResultId,
		);
		ui.byId("workstation-category").value = "torso";
		await ui.evaluate("submitWorkstation()");
		expect(sends).toBe(0);
		ui.byId("workstation-category").value = "detached-head";
		authorWorkstation(ui);
		for (const [key, value] of Object.entries({
			width: "1024",
			height: "1536",
			"anchor-x": "512",
			"anchor-y": "768",
			right: "1024",
			bottom: "1536",
		}))
			ui.byId(`workstation-${key}`).value = value;
		await ui.evaluate("submitWorkstation()");
		expect(ui.byId("workstation-status").dataset.state).toBe("HOLD");
		expect(sends).toBe(1);
		ui.byId("workstation-category").value = "fullbody-turntable";
		await ui.evaluate("submitWorkstation()");
		expect(sends).toBe(5);
		expect(ui.byId("workstation-history").children).toHaveLength(2);
		const closed = once(provider, "close");
		provider.close();
		provider.closeAllConnections();
		await closed;
		for (const button of ui.byId("workstation-history").children) {
			await button.click();
			const group = ui.byId("workstation-frames").children[0];
			expect(group?.dataset).toMatchObject({
				personId: f.person.id,
				jobId: button.dataset.jobId,
				identityResultId: f.identityResultId,
			});
			const frames = group?.querySelectorAll("li") ?? [];
			expect(frames).toHaveLength(
				button.textContent.includes("턴테이블") ? 4 : 1,
			);

			if (button.textContent.includes("몸통")) {
				const framesRoot = ui.byId("workstation-frames");
				const figcaption = findDesc(
					framesRoot,
					(el: any) => el.tagName === "figcaption",
				);
				expect(figcaption?.textContent).toContain("스타일 SHA");
				expect(figcaption?.textContent).toContain(f.person.id);
				const anchorEl = findDesc(framesRoot, (el: any) => el.tagName === "a");
				expect(anchorEl?.textContent).toBe("front PNG 다운로드");
				expect(anchorEl?.download).toContain("-torso-");
			}
			if (button.textContent.includes("분리된 머리")) {
				const framesRoot = ui.byId("workstation-frames");
				const figcaption = findDesc(
					framesRoot,
					(el: any) => el.tagName === "figcaption",
				);
				expect(figcaption?.textContent).toContain("배경 transparent alpha 0");
				expect(figcaption?.textContent).toContain(
					"정렬 owner-canvas / anchor 512,768 / crop 0,0,1024,1536",
				);
				const anchorEl = findDesc(framesRoot, (el: any) => el.tagName === "a");
				expect(anchorEl?.download).toContain("-detached-head-");
			}
			if (button.textContent.includes("턴테이블")) {
				expect(frames.map((frame) => frame.dataset.frameOrder)).toEqual([
					"0",
					"1",
					"2",
					"3",
				]);
				expect(frames.map((frame) => frame.dataset.view)).toEqual([
					"front",
					"profile",
					"side",
					"back",
				]);
				expect(
					new Set(frames.map((frame) => frame.dataset.requestId)).size,
				).toBe(4);
				expect(
					frames.map(
						(frame) =>
							findDesc(frame, (el: any) => el.tagName === "a")?.download,
					),
				).toEqual(
					["front", "profile", "side", "back"].map(
						(view) =>
							`${f.person.id}-fullbody-turntable-${button.dataset.jobId}-${view}.png`,
					),
				);
			}
		}
		const reloaded = await client((url, options) =>
			fetch(f.origin + url, {
				...options,
				headers: {
					...f.headers,
					...Object.fromEntries(new Headers(options.headers)),
				},
			}),
		);
		reloaded.byId("workstation-person").value = f.person.id;
		await reloaded.evaluate("loadWorkstationHistory()");
		expect(reloaded.byId("workstation-history").children).toHaveLength(2);
		expect(sends).toBe(5);
		const noCsrf = await fetch(`${f.origin}/tools/api/v2/workstations`, {
			method: "POST",
			headers: {
				cookie: f.cookie,
				origin: f.origin,
				"content-type": "application/json",
			},
			body: "{}",
		});
		expect(noCsrf.status).toBe(403);
		expect(
			(await f.request("/v2/workstations/person-9999/history")).status,
		).toBe(200);
		expect(sends).toBe(5);
	} finally {
		if (provider.listening) {
			const closed = once(provider, "close");
			provider.close();
			provider.closeAllConnections();
			await closed;
		}
		await f.close();
	}
}, 30000);

test("photo-less wiki requires explicit absence before single generation", async () => {
	const ui = await client();
	const hashes = { detail: "a".repeat(64), token: "b".repeat(64), image: null };
	const source = {
		personId: "person-1017",
		characterId: "K1017",
		name: "지연희",
		detail: { id: "person-1017" },
		token: { artProposal: { hair: "검은 단발" } },
		imageBase64: null,
		source: { kind: "live-wiki-http", sha256: hashes.detail },
		sourceHashes: hashes,
		generationEligibility: {
			eligible: true,
			sourceMode: "design-token-only",
			originalSourceHashes: hashes,
		},
	};
	ui.response("/wiki/people/person-1017", source);
	ui.evaluate(
		'connection = {state:"READY",expiresAt:Date.now()+60000,connectionId:"fixture"};',
	);
	await ui.evaluate('selectWiki("person-1017")');
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.byId("reference-absence").checked).toBe(false);
	expect(ui.byId("generation-mode").value).toBe("reference-img2img");
	expect(ui.byId("active-sheet").dataset["imageState"]).toBe("missing");
	expect(
		ui.evaluate(
			`immutableSelection(${JSON.stringify(source)}).originalSourceHashes.image`,
		),
	).toBeNull();
});

test("single workspace appends requested wiki pages including ineligible people", async () => {
	const ui = await client();
	ui.byId("workspace").hidden = false;
	ui.response("/wiki/people?q=&limit=25&cursor=0", {
		people: [wikiPerson("1003")],
		source: { kind: "live-wiki-http" },
		nextCursor: "1",
		total: 2,
	});
	ui.response("/wiki/people?q=&limit=25&cursor=1", {
		people: [wikiPerson("1010", false)],
		source: { kind: "live-wiki-http" },
		nextCursor: null,
		total: 2,
	});
	await ui.evaluate("searchWiki()");
	expect(ui.byId("wiki-person").children.map((node) => node.value)).toEqual([
		"",
		"1003",
	]);
	expect(ui.byId("wiki-person").disabled).toBe(false);
	expect(ui.byId("wiki-next").hidden).toBe(false);
	await ui.evaluate("searchWiki(1)");
	await ui.byId("task-single").click();
	expect(
		ui
			.byId("wiki-person")
			.ancestors()
			.some((node) => node.hidden),
	).toBe(false);
	expect(ui.byId("wiki-person").children.map((node) => node.value)).toEqual([
		"",
		"1003",
		"1010",
	]);
	expect(ui.byId("wiki-person").children.at(-1)?.disabled).toBe(false);
	await ui.evaluate("searchWiki(1)");
	expect(ui.byId("wiki-person").children.map((node) => node.value)).toEqual([
		"",
		"1003",
		"1010",
	]);
});

test("generation workstations share owner person selection and persisted history", async () => {
	const ui = await client();
	const imageBase64 = Buffer.from(ui.bytes).toString("base64");
	const source = {
		personId: "person-1017",
		characterId: "K1017",
		name: "공유 인물",
		detail: { identity: "shared" },
		token: { generationContract: { model: "fixture" } },
		imageBase64,
		sourceHashes: {
			detail: "a".repeat(64),
			token: "b".repeat(64),
			image: ui.pngSHA,
		},
	};
	ui.evaluate(
		`characters = [${JSON.stringify({ personId: source.personId, characterId: source.characterId, name: source.name })}]; renderCharacters();`,
	);
	ui.response(`/characters/${source.personId}`, source);
	ui.response(`/wiki/people/${source.personId}`, {
		personId: source.personId,
		characterId: source.characterId,
		generationEligibility: { eligible: true },
	});
	ui.response("/jobs", {
		history: [
			{
				job: {
					id: "11111111-1111-4111-8111-111111111111",
					state: "HOLD",
					imageUrl:
						"/tools/api/jobs/11111111-1111-4111-8111-111111111111/image",
				},
				source,
				createdAt: "2026-10-18T00:00:00.000Z",
			},
		],
	});
	ui.response(`/v2/workstations/${source.personId}/history`, {
		schema: "portal-workstation-history.v2",
		items: [],
	});
	ui.response("/v2/workstations/catalog", {
		schema: "portal-workstation-catalog.v2",
		categories: workstationCategories,
		productionGeneration: "BLOCKED_SINGLE_ATTEMPT_NOT_PROVED",
		paidProof: "NOT_RUN",
	});
	ui.response("/characters", { characters: [source] });
	ui.response("/references", {
		catalog: { styleReferenceSha256: "c".repeat(64) },
	});
	await ui.evaluate("loadJobHistory()");
	ui.evaluate('switchTask("single")');
	await ui.evaluate(`selectCharacter(${JSON.stringify(source.personId)})`);
	expect(ui.byId("history-person").value).toBe(source.personId);
	expect(ui.byId("person-history").children).toHaveLength(1);
	await ui.byId("task-turntable").click();
	await ui.evaluate("loadWorkstations()");
	expect(ui.byId("workstation-person").value).toBe(source.personId);
	expect(ui.evaluate("workstationSource.personId")).toBe(source.personId);
	expect(ui.byId("history-person").value).toBe(source.personId);
	expect(ui.byId("person-history").children).toHaveLength(1);
	const selectedPersonReads = ui.requests.filter(
		(url) => url === `/tools/api/characters/${source.personId}`,
	).length;
	await ui.byId("task-parts").click();
	expect(ui.byId("workstation-person").value).toBe(source.personId);
	await ui.byId("task-single").click();
	expect(ui.evaluate("selected.personId")).toBe(source.personId);
	expect(
		ui.requests.filter(
			(url) => url === `/tools/api/characters/${source.personId}`,
		),
	).toHaveLength(selectedPersonReads);
});

test("151-page catalog is usable after one response without waiting for eager completion", async () => {
	const ui = await client();
	for (let page = 0; page < 150; page++) {
		ui.response(`/wiki/people?q=&limit=25&cursor=${page * 25}`, {
			people: Array.from({ length: 25 }, (_, index) =>
				wikiPerson(String(page * 25 + index + 10000), index !== 24),
			),
			source: { kind: "live-wiki-http" },
			nextCursor: String((page + 1) * 25),
			total: 3775,
		});
	}
	const last = ui.hold("/wiki/people?q=&limit=25&cursor=3750");
	const loading = ui.evaluate("searchWiki()");
	await Promise.race([loading, last.requested]);
	expect(ui.byId("wiki-person").children).toHaveLength(26);
	expect(ui.byId("wiki-person").disabled).toBe(false);
	expect(
		ui.requests.filter((url) => url.includes("/wiki/people?")),
	).toHaveLength(1);
	for (let page = 1; page < 150; page++)
		await ui.evaluate(`searchWiki(${page * 25})`);
	expect(ui.byId("wiki-person").children).toHaveLength(3751);
	const finalLoad = ui.evaluate("searchWiki(3750)");
	await last.requested;
	expect(ui.byId("wiki-person").disabled).toBe(false);
	expect(ui.byId("wiki-person").children).toHaveLength(3751);
	last.resolve(
		Response.json({
			people: Array.from({ length: 25 }, (_, index) =>
				wikiPerson(String(13750 + index), false),
			),
			source: { kind: "live-wiki-http" },
			nextCursor: null,
			total: 3775,
		}),
	);
	await finalLoad;
	expect(ui.byId("wiki-person").children).toHaveLength(3776);
	expect(ui.byId("wiki-person").children.at(-1)?.disabled).toBe(false);
	expect(ui.byId("wiki-next").hidden).toBe(true);
});

test("catalog next-page failure keeps prior options and retries the same cursor", async () => {
	const ui = await client();
	ui.response("/wiki/people?q=&limit=25&cursor=0", {
		people: [wikiPerson("1003")],
		source: { kind: "live-wiki-http" },
		nextCursor: "25",
		total: 26,
	});
	await ui.evaluate("searchWiki()");
	ui.byId("wiki-person").value = "1003";
	const next = ui.hold("/wiki/people?q=&limit=25&cursor=25");
	const loading = ui.evaluate("searchWiki(25)");
	await next.requested;
	expect(ui.byId("wiki-next").disabled).toBe(true);
	expect(ui.byId("wiki-person").value).toBe("1003");
	expect(ui.byId("wiki-person").disabled).toBe(false);
	next.resolve(Response.json({ error: "WIKI_UNAVAILABLE" }, { status: 503 }));
	await loading;
	expect(ui.byId("wiki-person").children.map((node) => node.value)).toEqual([
		"",
		"1003",
	]);
	expect(ui.byId("wiki-status").textContent).toContain("HTTP_503");
	expect(ui.byId("wiki-next").disabled).toBe(false);
	expect(ui.byId("wiki-next").hidden).toBe(false);
	ui.response("/wiki/people?q=&limit=25&cursor=25", {
		people: [wikiPerson("1003"), wikiPerson("1010", false)],
		source: { kind: "live-wiki-http" },
		nextCursor: null,
		total: 2,
	});
	await ui.evaluate("searchWiki(25)");
	expect(ui.byId("wiki-person").children.map((node) => node.value)).toEqual([
		"",
		"1003",
		"1010",
	]);
	expect(ui.byId("wiki-person").value).toBe("1003");
});

test("server search replaces only its query results and ignores a stale next page", async () => {
	const ui = await client();
	ui.response("/wiki/people?q=&limit=25&cursor=0", {
		people: [wikiPerson("1003")],
		source: { kind: "live-wiki-http" },
		nextCursor: "25",
		total: 3775,
	});
	await ui.evaluate("searchWiki()");
	const old = ui.hold("/wiki/people?q=&limit=25&cursor=25");
	const stale = ui.evaluate("searchWiki(25)");
	await old.requested;
	ui.byId("wiki-query").value = "13774";
	ui.response("/wiki/people?q=13774&limit=25&cursor=0", {
		people: [wikiPerson("13774", false)],
		source: { kind: "live-wiki-http" },
		nextCursor: null,
		total: 1,
	});
	await ui.evaluate("searchWiki()");
	old.resolve(
		Response.json({
			people: [wikiPerson("1004")],
			source: { kind: "live-wiki-http" },
			nextCursor: "50",
		}),
	);
	await stale;
	expect(ui.byId("wiki-person").children.map((node) => node.value)).toEqual([
		"",
		"13774",
	]);
	expect(ui.byId("wiki-person").children.at(-1)?.disabled).toBe(false);
	expect(ui.byId("wiki-next").hidden).toBe(true);
	expect(ui.byId("wiki-person").getAttribute("aria-busy")).toBe(null);
});

test("nonadvancing catalog cursor is an explicit error without eager retry", async () => {
	const ui = await client();
	ui.response("/wiki/people?q=&limit=25&cursor=0", {
		people: [wikiPerson("1003")],
		source: { kind: "live-wiki-http" },
		nextCursor: "0",
	});
	await ui.evaluate("searchWiki()");
	expect(ui.byId("wiki-status").textContent).toContain("UNKNOWN_WIKI_RESPONSE");
	expect(
		ui.requests.filter((url) => url.includes("/wiki/people?")),
	).toHaveLength(1);
});

test("server history restores completed jobs, filters by person, and clears on logout", async () => {
	const ui = await client();
	ui.prepare("old-result");
	ui.response("/jobs", {
		jobs: [],
		lease: { admissionBlocked: false },
		history: [
			{
				job: {
					id: "old-result",
					state: "HOLD",
					imageUrl: "/tools/api/jobs/old-result/image",
				},
				source: {
					personId: "1003",
					characterId: "K1003",
					name: "Historical name",
				},
			},
			{
				job: { id: "other", state: "RUNNING", imageUrl: null },
				source: {
					personId: "1004",
					characterId: "K1004",
					name: "Other person",
				},
			},
		],
	});
	await ui.evaluate("loadJobHistory()");
	expect(ui.byId("person-history").children).toHaveLength(2);
	ui.byId("history-person").value = "1003";
	await ui.byId("history-person").fire("change");
	expect(ui.byId("person-history").children).toHaveLength(1);
	const person = ui.byId("person-history").children[0];
	expect(person?.dataset.personId).toBe("1003");
	const portrait = person?.children[1]?.children[0];
	expect(portrait?.dataset.jobId).toBe("old-result");
	expect(portrait?.dataset.kind).toBe("portrait");
	expect(portrait?.dataset.reviewAuthority).toBe("owner");
	await portrait?.click();
	expect(ui.evaluate("activeJob.id")).toBe("old-result");
	expect(ui.byId("portrait").hidden).toBe(false);
	ui.evaluate("clearProtected()");
	expect(ui.byId("person-history").children).toHaveLength(0);
	expect(ui.byId("history-person").children).toHaveLength(1);
	expect(ui.byId("portrait").hidden).toBe(true);
});

test("completion refresh while another person is selected preserves their source and announces durable result", async () => {
	const ui = await client();
	ui.evaluate(
		'activeTask = "single"; selected = {personId:"1004",source:{name:"Other person"}}; activeJob = {id:"late",state:"RUNNING",imageUrl:null,source:{name:"Finished person"}};',
	);
	const late = ui.hold("/jobs");
	const loading = ui.evaluate("loadJobHistory()");
	await late.requested;
	late.resolve(
		Response.json({
			jobs: [],
			history: [
				{
					job: {
						id: "late",
						state: "HOLD",
						imageUrl: "/tools/api/jobs/late/image",
					},
					source: { personId: "1003", name: "Finished person" },
				},
			],
			lease: {},
		}),
	);
	await loading;
	expect(ui.evaluate("selected.personId")).toBe("1004");
	expect(ui.evaluate("activeJob.state")).toBe("HOLD");
	expect(ui.byId("person-history").children).toHaveLength(1);
	expect(ui.byId("history-status").textContent).toContain("1");
});

test("viewed pending historical job displays asynchronous completion without reselection", async () => {
	const ui = await client();
	ui.prepare("pending-result");
	ui.evaluate(
		'activeJob = {id:"pending-result",state:"RUNNING",imageUrl:null,source:{personId:"1003",name:"Historical"}};',
	);
	ui.response("/jobs", {
		history: [
			{
				job: {
					id: "pending-result",
					state: "HOLD",
					imageUrl: "/tools/api/jobs/pending-result/image",
				},
				source: { personId: "1003", name: "Historical" },
			},
		],
		lease: {},
	});
	await ui.evaluate("loadJobHistory()");
	expect(ui.evaluate("activeJob.state")).toBe("HOLD");
	expect(ui.byId("portrait").hidden).toBe(false);
	expect(ui.writes).toHaveLength(0);
});

test("completion during historical status load displays when that in-flight load settles", async () => {
	const ui = await client();
	ui.prepare("settling");
	const status = ui.hold("/jobs/settling");
	const selecting = ui.evaluate(
		'selectHistoryJob({job:{id:"settling",state:"RUNNING"},source:{name:"A"}})',
	);
	await status.requested;
	ui.response("/jobs", {
		history: [
			{
				job: {
					id: "settling",
					state: "HOLD",
					imageUrl: "/tools/api/jobs/settling/image",
				},
				source: { name: "A", personId: "1003" },
			},
		],
		lease: {},
	});
	await ui.evaluate("loadJobHistory()");
	status.resolve(
		Response.json({
			job: { id: "settling", state: "RUNNING", imageUrl: null },
		}),
	);
	await selecting;
	expect(ui.byId("portrait").hidden).toBe(false);
	expect(ui.evaluate("activeJob.id")).toBe("settling");
	expect(
		ui.requests.filter((path) => path.endsWith("/jobs/settling/image")),
	).toHaveLength(1);
	expect(ui.writes).toHaveLength(0);
});

test("person navigation before terminal history releases abandoned historical pending ownership", async () => {
	const ui = await client();
	ui.evaluate(
		'connection={state:"READY",expiresAt:Date.now()+60000,connectionId:"fixture"};activeBatch=null;',
	);
	const status = ui.hold("/jobs/abandoned");
	const selecting = ui.evaluate(
		'selectHistoryJob({job:{id:"abandoned",state:"RUNNING",imageUrl:null},source:{personId:"1003",name:"Old"}})',
	);
	await status.requested;
	ui.response("/wiki/people/1004", wikiPerson("1004"));
	await ui.evaluate('selectWiki("1004")');
	status.resolve(
		Response.json({
			job: { id: "abandoned", state: "RUNNING", imageUrl: null },
		}),
	);
	await selecting;
	expect(ui.evaluate("resultPending")).toBe(false);
	ui.response("/jobs", {
		history: [
			{
				job: {
					id: "abandoned",
					state: "HOLD",
					imageUrl: "/tools/api/jobs/abandoned/image",
				},
				source: { personId: "1003", name: "Old" },
			},
		],
		lease: { admissionBlocked: false },
	});
	await ui.evaluate("loadJobHistory()");
	expect(ui.evaluate("selected.personId")).toBe("1004");
	expect(ui.evaluate("selected.eligible")).toBe(true);
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.byId("refresh-job").disabled).toBe(false);
	expect(ui.byId("portrait").hidden).toBe(true);
	expect(
		ui.requests.filter((path) => path.endsWith("/jobs/abandoned/image")),
	).toHaveLength(0);
	expect(ui.writes).toHaveLength(0);
});

test("abandoned historical finally cannot release a newer historical operation pending ownership", async () => {
	const ui = await client();
	const old = ui.hold("/jobs/old-pending");
	const first = ui.evaluate(
		'selectHistoryJob({job:{id:"old-pending",state:"RUNNING"},source:{personId:"1003",name:"Old"}})',
	);
	await old.requested;
	ui.response("/wiki/people/1004", wikiPerson("1004"));
	await ui.evaluate('selectWiki("1004")');
	const newer = ui.hold("/jobs/new-pending");
	const second = ui.evaluate(
		'selectHistoryJob({job:{id:"new-pending",state:"RUNNING"},source:{personId:"1004",name:"New"}})',
	);
	await newer.requested;
	old.resolve(
		Response.json({
			job: { id: "old-pending", state: "RUNNING", imageUrl: null },
		}),
	);
	await first;
	expect(ui.evaluate("resultPending")).toBe(true);
	expect(ui.evaluate("activeJob.id")).toBe("new-pending");
	expect(ui.byId("refresh-job").disabled).toBe(true);
	newer.resolve(
		Response.json({
			job: { id: "new-pending", state: "RUNNING", imageUrl: null },
		}),
	);
	await second;
	expect(ui.evaluate("resultPending")).toBe(false);
	expect(ui.evaluate("activeJob.id")).toBe("new-pending");
	expect(ui.writes).toHaveLength(0);
});

for (const destination of ["person", "result", "logout"] as const) {
	test(`historical completion during status await is invalidated by ${destination}`, async () => {
		const ui = await client();
		ui.prepare("old-overlap");
		const status = ui.hold("/jobs/old-overlap");
		const selecting = ui.evaluate(
			'selectHistoryJob({job:{id:"old-overlap",state:"RUNNING"},source:{personId:"1003",name:"Old"}})',
		);
		await status.requested;
		ui.response("/jobs", {
			history: [
				{
					job: {
						id: "old-overlap",
						state: "HOLD",
						imageUrl: "/tools/api/jobs/old-overlap/image",
					},
					source: { personId: "1003", name: "Old" },
				},
			],
			lease: {},
		});
		await ui.evaluate("loadJobHistory()");
		if (destination === "person") {
			ui.response("/wiki/people/1004", wikiPerson("1004", false));
			await ui.evaluate('selectWiki("1004")');
		} else if (destination === "result") {
			ui.prepare("new-result");
			await ui.evaluate(
				'selectHistoryJob({job:{id:"new-result",state:"HOLD"},source:{personId:"1004",name:"New"}})',
			);
		} else ui.evaluate("clearProtected()");
		status.resolve(
			Response.json({
				job: { id: "old-overlap", state: "RUNNING", imageUrl: null },
			}),
		);
		await selecting;
		await ui.evaluate("displayDeferredHistoryResult()");
		expect(
			ui.requests.filter((path) => path.endsWith("/jobs/old-overlap/image")),
		).toHaveLength(0);
		if (destination === "result")
			expect(ui.evaluate("activeJob.id")).toBe("new-result");
		else expect(ui.byId("portrait").hidden).toBe(true);
	});
}

test("completion suppressed during pending refresh remains loadable after settlement", async () => {
	const ui = await client();
	ui.prepare("pending-edge");
	ui.evaluate(
		'activeJob={id:"pending-edge",state:"RUNNING",imageUrl:null,source:{name:"A"}}; resultPending=true;',
	);
	ui.response("/jobs", {
		history: [
			{
				job: {
					id: "pending-edge",
					state: "HOLD",
					imageUrl: "/tools/api/jobs/pending-edge/image",
				},
				source: { name: "A", personId: "1003" },
			},
		],
		lease: {},
	});
	await ui.evaluate("loadJobHistory()");
	expect(ui.byId("portrait").hidden).toBe(true);
	ui.evaluate("resultPending=false");
	await ui.evaluate("loadJobHistory()");
	expect(ui.byId("portrait").hidden).toBe(false);
	expect(ui.writes).toHaveLength(0);
});

test("composition keeps two pages independent, invalidates confirmation, and submits exact frozen selections once", async () => {
	const ui = await client();
	ui.evaluate(
		'connection = {state:"READY",expiresAt:Date.now()+60000,connectionId:"fixture"}; selected = {personId:"single"};',
	);
	for (const [cursor, people] of [
		[0, [wikiPerson("1003")]],
		[1, [wikiPerson("1004"), wikiPerson("1010", false)]],
	] as const) {
		ui.response(`/wiki/people?q=QA&limit=25&cursor=${cursor}`, {
			people,
			source: { kind: "live-wiki-http" },
			nextCursor: cursor === 0 ? 1 : null,
		});
		for (const person of people)
			ui.response(`/wiki/people/${person.personId}`, person);
	}
	ui.byId("wiki-query").value = "QA";
	await ui.evaluate("searchWiki()");
	const first = ui.byId("wiki-batch-list").querySelectorAll("input")[0];
	if (!first) throw new Error("Missing first person");
	first.checked = true;
	await first.fire("change");
	await ui.evaluate("searchWiki(1)");
	const [second, ineligible] = ui
		.byId("wiki-batch-list")
		.querySelectorAll("input");
	if (!second || !ineligible) throw new Error("Missing second page");
	expect(ineligible.disabled).toBe(true);
	ineligible.checked = true;
	await ineligible.fire("change");
	second.checked = true;
	await second.fire("change");
	expect(ui.evaluate("[...batchSelection.keys()] ")).toEqual(["1003", "1004"]);
	expect(ui.evaluate("selected.personId")).toBe("single");
	ui.byId("batch-reviewed").checked = true;
	await ui.byId("batch-reviewed").fire("change");
	expect(ui.byId("generate-batch").disabled).toBe(false);
	await ui.byId("batch-selection-list").querySelectorAll("button")[0]?.click();
	expect(ui.byId("batch-reviewed").checked).toBe(false);
	ui.byId("batch-reviewed").checked = true;
	await ui.byId("batch-reviewed").fire("change");
	await ui.evaluate("searchWiki()");
	const reselect = ui.byId("wiki-batch-list").querySelectorAll("input")[0];
	if (!reselect) throw new Error("Missing reselect person");
	reselect.checked = true;
	await reselect.fire("change");
	expect(ui.byId("batch-reviewed").checked).toBe(false);
	expect(ui.byId("generate-batch").disabled).toBe(true);
	expect(
		ui.evaluate(
			'Object.isFrozen(batchSelection.get("1003").originalSourceHashes)',
		),
	).toBe(true);
	ui.byId("batch-reviewed").checked = true;
	await ui.byId("batch-reviewed").fire("change");
	ui.response("/batches", {
		batch: { batchId: "accepted", state: "RUNNING", items: [] },
	});
	await ui.byId("generate-batch").click();
	await ui.byId("generate-batch").click();
	expect(ui.writes.length).toBe(1);
	const body = JSON.parse(ui.writes[0]?.body ?? "");
	expect(body.items).toEqual(
		["1004", "1003"].map((id) => ({
			personId: id,
			characterId: `K${id}`,
			name: id,
			wikiDetailSHA: "d".repeat(64),
			originalSourceHashes:
				wikiPerson(id).generationEligibility.originalSourceHashes,
		})),
	);
	expect(body.connectionId).toBe("fixture");
	expect(ui.evaluate("activeBatch.batchId")).toBe("accepted");
	expect(ui.evaluate("submittedBatchId")).toBeNull();
	expect(ui.byId("workspace").dataset.activeTask).toBe("queue");
});

function queueBatch(statuses: string[], state = "PAUSED_UNKNOWN") {
	return {
		batchId: "batch",
		connectionId: "fixture",
		connectionRevision: 1,
		state,
		items: statuses.map((status, ordinal) => ({
			ordinal,
			status,
			itemId: String.fromCharCode(65 + ordinal),
			jobId: status === "PENDING" ? null : String.fromCharCode(65 + ordinal),
			requestId: String.fromCharCode(65 + ordinal),
			name: `Person ${ordinal}`,
			characterId: `K${ordinal}`,
			snapshotSHA: "a".repeat(64),
		})),
		progress: {
			total: statuses.length,
			settled: statuses.filter((s) =>
				["HOLD", "FAILED", "CANCELLED"].includes(s),
			).length,
			hold: statuses.filter((s) => s === "HOLD").length,
			failed: statuses.filter((s) => s === "FAILED").length,
			cancelled: statuses.filter((s) => s === "CANCELLED").length,
			running: statuses.filter((s) => s === "RUNNING").length,
			unknown: statuses.filter((s) => s === "UNKNOWN").length,
			pending: statuses.filter((s) => s === "PENDING").length,
		},
	};
}

test("lost submission stays provisional until explicit lookup without replay or cancel", async () => {
	const ui = await client();
	ui.evaluate(
		'activeBatch = null; connection = {connectionId:"fixture",state:"READY",expiresAt:Date.now()+60000}; batchSelection.set("1003", {personId:"1003"}); switchTask("composition");',
	);
	ui.byId("batch-reviewed").checked = true;
	await ui.byId("batch-reviewed").fire("change");
	const post = ui.hold("/batches");
	const submitting = ui.byId("generate-batch").click();
	await post.requested;
	const id = JSON.parse(ui.writes[0]?.body ?? "").batchId;
	expect(ui.evaluate("activeBatch")).toBeNull();
	expect(ui.evaluate("submittedBatchId")).toBe(id);
	expect(ui.byId("workspace").dataset.activeTask).toBe("composition");
	post.reject(new Error("response lost"));
	await submitting;
	expect(ui.byId("generate-batch").disabled).toBe(true);
	expect(ui.byId("cancel-batch").hidden).toBe(true);
	await ui.byId("generate-batch").click();
	await ui.evaluate("batchAction(true)");
	ui.response(`/batches/${id}`, {
		batch: { ...queueBatch(["PENDING"], "RUNNING"), batchId: id },
	});
	await ui.byId("refresh-batch").click();
	expect(ui.evaluate("submittedBatchId")).toBeNull();
	expect(ui.evaluate("activeBatch.batchId")).toBe(id);
	expect(ui.byId("workspace").dataset.activeTask).toBe("queue");
	expect(ui.writes).toHaveLength(1);
	expect(ui.requests).toContain(`/tools/api/batches/${id}`);
});

test("queue UNKNOWN remains unsettled and navigation and refresh do not dispatch", async () => {
	const ui = await client();
	ui.prepare("A");
	const batch = queueBatch(["HOLD", "UNKNOWN", "PENDING"]);
	ui.evaluate(`receiveBatch(${JSON.stringify(batch)})`);
	expect(ui.byId("batch-progress").dataset).toMatchObject({
		settled: "1",
		total: "3",
		unknown: "1",
		pending: "1",
	});
	expect(
		ui
			.byId("batch-view")
			.querySelectorAll("li")
			.map((li) => li.dataset),
	).toEqual([
		{ ordinal: "0", status: "HOLD" },
		{ ordinal: "1", status: "UNKNOWN" },
		{ ordinal: "2", status: "PENDING" },
	]);
	expect(
		ui
			.byId("batch-view")
			.querySelectorAll("button")
			.map((button) => button.disabled),
	).toEqual([false, true, true]);
	ui.response("/batches/batch", { batch });
	for (const task of ["single", "composition", "queue", "review"])
		await ui.byId(`task-${task}`).click();
	await ui.byId("refresh-batch").click();
	expect(ui.evaluate("ownerBlocked")).toBe(true);
	expect(ui.writes).toHaveLength(0);
});

test("cancel pending preserves running and result navigation uses the dirty guard", async () => {
	const ui = await client();
	const running = queueBatch(["RUNNING", "PENDING"], "RUNNING");
	ui.evaluate(`receiveBatch(${JSON.stringify(running)})`);
	const cancelled = {
		...queueBatch(["RUNNING", "CANCELLED"], "CANCEL_REQUESTED"),
		cancelRequested: true,
	};
	ui.response("/batches/batch/cancel-pending", { batch: cancelled });
	await ui.byId("cancel-batch").click();
	expect(ui.evaluate("activeBatch.items[0].status")).toBe("RUNNING");
	expect(ui.byId("cancel-batch").disabled).toBe(true);
	expect(ui.writes.map((write) => write.url)).toEqual([
		"/tools/api/batches/batch/cancel-pending",
	]);
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	ui.byId("notes-identity-and-face").value = "retained";
	await ui.byId("notes-identity-and-face").fire("input");
	const complete = queueBatch(["HOLD", "HOLD"], "COMPLETED");
	ui.evaluate(`receiveBatch(${JSON.stringify(complete)})`);
	await ui.byId("batch-view").querySelectorAll("button")[1]?.click();
	expect(ui.byId("dirty-dialog").open).toBe(true);
	expect(ui.evaluate("reviewBinding.jobId")).toBe("A");
	await ui.byId("draft-keep").click();
	expect(ui.evaluate("reviewBinding.jobId")).toBe("B");
	expect(ui.byId("workspace").dataset.activeTask).toBe("review");
	expect(ui.byId("notes-identity-and-face").value).toBe("");
	expect(ui.writes).toHaveLength(1);
});

test("composition includes pending reads in max20 and synchronizes their newly searched checkboxes", async () => {
	const ui = await client();
	const people = Array.from({ length: 21 }, (_, index) =>
		wikiPerson(String(index)),
	);
	ui.evaluate(`renderWikiBatchOptions(${JSON.stringify(people)})`);
	const checks = ui.byId("wiki-batch-list").querySelectorAll("input");
	const reads = people
		.slice(0, 20)
		.map((person) => ui.hold(`/wiki/people/${person.personId}`));
	const selecting = checks.slice(0, 20).map((check) => {
		check.checked = true;
		return check.fire("change");
	});
	await Promise.all(reads.map((read) => read.requested));
	expect(ui.evaluate("selectionPending + batchSelection.size")).toBe(20);
	const last = checks[20];
	if (!last) throw new Error("Missing 21st person");
	last.checked = true;
	await last.fire("change");
	expect(last.checked).toBe(false);
	expect(ui.requests).not.toContain("/tools/api/wiki/people/20");
	ui.evaluate(`renderWikiBatchOptions(${JSON.stringify(people)})`);
	expect(
		ui.byId("wiki-batch-list").querySelectorAll("input")[0]?.disabled,
	).toBe(true);
	for (const [index, read] of reads.entries())
		read.resolve(Response.json(people[index]));
	await Promise.all(selecting);
	expect(ui.evaluate("batchSelection.size")).toBe(20);
	expect(ui.evaluate("selectionPending")).toBe(0);
	expect(
		ui.byId("wiki-batch-list").querySelectorAll("input")[0]?.disabled,
	).toBe(false);
	expect(ui.byId("wiki-batch-list").querySelectorAll("input")[0]?.checked).toBe(
		true,
	);
	expect(ui.writes.length).toBe(0);
});

test("visible Wiki dropdown exposes the selected sheet and original preview", async () => {
	const ui = await client();
	const bytes = new Uint8Array([137, 80, 78, 71]);
	const source = {
		...wikiPerson("person-1003"),
		imageBase64: Buffer.from(bytes).toString("base64"),
		sourceHashes: {
			detail: "d".repeat(64),
			token: "b".repeat(64),
			image: createHash("sha256").update(bytes).digest("hex"),
		},
	};
	const hiddenAncestors = (id: string) => {
		const hidden: string[] = [];
		for (let node: Element | null = ui.byId(id); node; node = node.parent)
			if (node.hidden) hidden.push(node.id);
		return hidden;
	};
	ui.byId("workspace").hidden = false;
	await ui.byId("task-composition").fire("click");
	expect(hiddenAncestors("wiki-person")).toEqual([]);
	ui.response("/wiki/people/person-1003", source);
	ui.response(
		`/wiki/people/person-1003?${new URLSearchParams({ schemaVersion: "2", inputMode: "reference-img2img", sourceSelection: JSON.stringify({ kind: "selected", personId: "person-1003", sourceSHA256: source.sourceHashes.image }) })}`,
		{ ...source, sourceAcquisition: { status: "acquired", eligible: true } },
	);
	ui.byId("wiki-person").value = "person-1003";
	await ui.byId("wiki-person").fire("change");
	expect(ui.evaluate("selected.source")).toMatchObject(source);
	expect(hiddenAncestors("active-sheet")).toEqual([]);
	expect(hiddenAncestors("portrait")).toEqual([]);
	expect(ui.byId("active-detail-hash").textContent).toBe(
		source.sourceHashes.detail,
	);
	expect(ui.byId("active-image-status").dataset.state).toBe("verified");
	expect(ui.evaluate("batchSelection.size")).toBe(0);
	expect(ui.writes).toEqual([]);
});

test("active sheet automatically binds artifacts, keeps manual files optional, and clears stale status", async () => {
	const ui = await client();
	const bytes = new Uint8Array([137, 80, 78, 71]);
	const source = {
		...wikiPerson("person-1003"),
		generationEligibility: {
			...wikiPerson("person-1003").generationEligibility,
			originalSourceHashes: { detail: "f".repeat(64) },
		},
		imageBase64: Buffer.from(bytes).toString("base64"),
		sourceHashes: {
			detail: "d".repeat(64),
			token: "b".repeat(64),
			image: createHash("sha256").update(bytes).digest("hex"),
		},
	};
	ui.response("/wiki/people/person-1003", source);
	await ui.evaluate('selectWiki("person-1003")');
	expect(ui.evaluate("selected.source")).toMatchObject(source);
	expect(ui.byId("active-sheet").dataset.kind).toBe("wiki");
	expect(ui.byId("active-sheet").dataset.eligible).toBe("true");
	for (const key of ["detail", "token", "image"] as const) {
		expect(ui.byId(`active-${key}-hash`).textContent).toBe(
			source.sourceHashes[key],
		);
		expect(ui.byId(`active-${key}-status`).dataset.state).toBe(
			key === "image" ? "verified" : "loaded",
		);
	}
	for (const id of ["detail-file", "token-file", "image-file"])
		expect(ui.byId(id).files).toEqual([]);
	expect(ui.byId("manual-sheet-disclosure").open).toBe(false);
	expect(ui.byId("upload-form").ancestors()).toContain(
		ui.byId("manual-sheet-disclosure"),
	);
	expect(ui.writes).toEqual([]);
	ui.byId("manual-sheet-disclosure").open = true;
	const files = [
		new File([JSON.stringify(source.detail)], "detail.json"),
		new File([JSON.stringify(source.token)], "token.json"),
		new File([bytes], "image.png"),
	];
	for (const [index, id] of [
		"detail-file",
		"token-file",
		"image-file",
	].entries()) {
		const file = files[index];
		if (!file) throw new Error("Missing manual fixture file");
		ui.byId(id).files = [file];
	}
	expect(ui.evaluate("selected.personId")).toBe("person-1003");
	const upload = ui.hold("/sheets");
	const applying = ui.byId("upload-form").fire("submit");
	await upload.requested;
	expect(ui.byId("active-sheet").dataset.kind).toBe("wiki");
	upload.resolve(Response.json({ ...source, sheetId: "manual-sheet" }));
	await applying;
	expect(ui.evaluate("selected.sheetId")).toBe("manual-sheet");
	expect(ui.byId("active-sheet").dataset.kind).toBe("manual");
	expect(ui.byId("active-image-status").dataset.state).toBe("verified");
	ui.response("/characters/person-1003", { ...source, source: undefined });
	await ui.evaluate('selectCharacter("person-1003")');
	expect(ui.byId("active-sheet").dataset.kind).toBe("registered");
	const old = ui.hold("/wiki/people/old");
	const selecting = ui.evaluate('selectWiki("old")');
	await old.requested;
	expect(ui.byId("active-image-status").dataset.state).toBe("loading");
	expect(ui.byId("active-image-hash").textContent).toBe("");
	ui.response("/wiki/people/missing", {
		...wikiPerson("missing", false),
		token: null,
		sourceHashes: { detail: "e".repeat(64), token: null, image: null },
	});
	await ui.evaluate('selectWiki("missing")');
	old.resolve(Response.json(source));
	await selecting;
	expect(ui.byId("active-sheet").dataset.eligible).toBe("false");
	expect(ui.byId("active-token-status").dataset.state).toBe("missing");
	expect(ui.byId("active-image-status").dataset.state).toBe("missing");
	expect(ui.byId("portrait").hidden).toBe(true);
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.writes.map((write) => write.url)).toEqual(["/tools/api/sheets"]);
	ui.evaluate("clearProtected()");
	expect(ui.byId("active-sheet").dataset.kind).toBe("none");
	expect(ui.byId("active-detail-hash").textContent).toBe("");
});

test("native UI closed capability preserves defaults and missing infrastructure never becomes credentials fallback", async () => {
	const ui = await client();
	ui.response("/connections", { endpoints: [], connection: null });
	await ui.evaluate("loadConnections()");
	expect(ui.evaluate("generationProvider")).toBe("openai-compatible");
	expect(
		ui
			.byId("generation-provider")
			.children.find((option) => option.value === "native-moss")?.disabled,
	).toBe(true);
	expect(ui.evaluate("nativeReason()")).toBe("NATIVE_CAPABILITY_ABSENT");
	for (const patch of [
		{ command: "python" },
		{ adapterSHA256: "b".repeat(64) },
		{
			connection: {
				...nativeMossCapability().connection,
				profileDigest: "b".repeat(64),
			},
		},
	])
		expect(() =>
			ui.evaluate(
				`readNativeCapability(${JSON.stringify({ ...nativeMossCapability(), ...patch })})`,
			),
		).toThrow();
	ui.response("/connections", {
		endpoints: [],
		connection: { state: "READY", expiresAt: Date.now() + 60000 },
		capabilities: {
			nativeMoss: { ...nativeMossCapability(), unexpected: true },
		},
	});
	await ui.evaluate("loadConnections()");
	expect(ui.evaluate("connectionReady()")).toBe(true);
	expect(ui.evaluate("nativeReason()")).toBe("NATIVE_CAPABILITY_INVALID");
	expect(ui.writes).toHaveLength(0);
});

test("native UI explicit connect and recipe transitions send one exact v2 UUID without fallback", async () => {
	const ui = await client();
	ui.response("/connections", {
		endpoints: [],
		connection: null,
		capabilities: { nativeMoss: nativeMossCapability(false) },
	});
	await ui.evaluate("loadConnections()");
	ui.byId("generation-provider").value = "native-moss";
	await ui.byId("generation-provider").fire("change");
	expect(ui.writes).toHaveLength(0);
	ui.response("/connections", {
		capabilities: { nativeMoss: nativeMossCapability() },
	});
	await ui.byId("native-connect").fire("click");
	expect(JSON.parse(ui.writes[0]?.body ?? "{}")).toEqual({
		provider: "native-moss",
		model: nativeMossUIContract.model,
	});
	ui.evaluate(
		`selected={personId:"person-1003",eligible:true,sourceSelection:{kind:"selected",personId:"person-1003",sourceSHA256:"${"a".repeat(64)}"},source:{name:"Fixture",characterId:"K1003",sourceAcquisition:{status:"acquired"}}};`,
	);
	ui.byId("native-recipe").value = "recovery16-native-flow-source025-v1";
	await ui.byId("native-recipe").fire("change");
	expect(ui.byId("generate").disabled).toBe(false);
	ui.byId("upper-color").value = "dark blue";
	await ui.byId("upper-color").fire("input");
	await ui.evaluate("generateSelection(selected)");
	expect(ui.writes).toHaveLength(1);
	ui.byId("upper-color").value = "";
	ui.evaluate('selected.sheetId="d887f6e9-8731-4b33-99dc-f68115136224";');
	await ui.evaluate("generateSelection(selected)");
	expect(ui.evaluate("nativeBlockReason()")).toBe(
		"NATIVE_UPLOADED_SOURCE_UNSUPPORTED",
	);
	expect(ui.writes).toHaveLength(1);
	ui.evaluate("delete selected.sheetId;");
	ui.response("/generations", {
		job: {
			id: "1b540cc5-69cc-4134-ab69-162452321a7c",
			state: "FAILED",
			imageUrl: null,
		},
	});
	ui.response("/jobs", { jobs: [] });
	await ui.evaluate("generateSelection(selected)");
	const payload = JSON.parse(ui.writes.at(-1)?.body ?? "{}");
	expect(referenceGenerationRequestSchema.safeParse(payload).success).toBe(
		true,
	);
	expect(payload).toMatchObject({
		provider: "native-moss",
		providerModel: nativeMossUIContract.model,
		nativeRecipe: "recovery16-native-flow-source025-v1",
		generationProfile: "native340-v1",
		explicitEdits: [],
		size: "340x510",
	});
	expect(payload.sourceRecipe).toBeUndefined();
	expect(payload.requestId).toMatch(/^[a-f0-9-]{36}$/);
	expect(
		ui.writes.filter((write) => write.url.endsWith("/generations")),
	).toHaveLength(1);
	expect(ui.evaluate("generationProvider")).toBe("native-moss");
	ui.byId("generation-mode").value = "token-only";
	await ui.byId("generation-mode").fire("change");
	expect(ui.evaluate("generationProvider")).toBe("native-moss");
	expect(ui.evaluate("nativeRecipe")).toBe("");
	expect(
		ui.byId("native-recipe").children.map((option) => option.value),
	).toEqual(["", "recovery16-native-token-v1"]);
	ui.byId("generation-mode").value = "reference-img2img";
	await ui.byId("generation-mode").fire("change");
	expect(ui.evaluate("generationProvider")).toBe("native-moss");
});

test("native UI retained recipe labels ignore draft and offline state keeps native selected", async () => {
	const ui = await client();
	ui.evaluate(
		`nativeCapability=readNativeCapability(${JSON.stringify(nativeMossCapability())});generationProvider="native-moss";nativeRecipe="recovery16-native-flow-source025-v1";`,
	);
	const retained = {
		provider: "native-moss",
		providerModel: nativeMossUIContract.model,
		nativeRecipe: "recovery16-native-flow-source045-v1",
	};
	expect(
		ui.evaluate(
			`retainedNativeLabel({originalRequest:${JSON.stringify(retained)}})`,
		),
	).toContain(retained.nativeRecipe);
	expect(
		ui.evaluate(
			`retainedNativeLabel({originalRequest:${JSON.stringify(retained)}})`,
		),
	).not.toContain("source025");
	ui.evaluate(
		'nativeCapability={...nativeCapability,generationEnabled:false,reason:"NATIVE_SSH_NOT_READY"};updateAction();',
	);
	expect(ui.evaluate("generationProvider")).toBe("native-moss");
	expect(ui.evaluate("nativeReason()")).toBe("NATIVE_SSH_NOT_READY");
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.writes).toHaveLength(0);
});

test("uploaded sheets preserve v2 source mode and edits without wiki lookup or legacy fallback", async () => {
	const ui = await client();
	const bytes = new Uint8Array([137, 80, 78, 71]);
	const image = createHash("sha256").update(bytes).digest("hex");
	const source = {
		sheetId: "d887f6e9-8731-4b33-99dc-f68115136224",
		personId: "person-1003",
		characterId: "K1003",
		name: "Upload fixture",
		sourceHashes: { detail: "a".repeat(64), token: "b".repeat(64), image },
	};
	const detail = {
		id: source.personId,
		name: source.name,
		detailRoute: "/people/person-1003",
		familyTree: { personId: source.characterId },
	};
	const token = {
		personId: source.personId,
		characterId: source.characterId,
		name: source.name,
		image: { sha256: image },
	};
	ui.response("/sheets", source);
	ui.evaluate(
		'connection={state:"READY",expiresAt:Date.now()+60000,connectionId:"975a9a70-d62a-4887-b783-d578c5f3ffae"};',
	);
	await ui.evaluate(
		`applyUpload([new Blob([${JSON.stringify(JSON.stringify(detail))}]), new Blob([${JSON.stringify(JSON.stringify(token))}]), new Blob([new Uint8Array([137,80,78,71])])])`,
	);
	expect(ui.byId("active-image-status").dataset.state).toBe("verified");
	expect(ui.evaluate("referenceInputReady()")).toBe(true);
	ui.byId("generation-mode").value = "reference-img2img";
	await ui.byId("generation-mode").fire("change");
	ui.byId("upper-color").value = "red";
	await ui.byId("upper-color").fire("input");
	expect(ui.byId("generate").disabled).toBe(true);
	ui.byId("upper-color").value = "dark blue";
	await ui.byId("upper-color").fire("input");
	expect(ui.byId("generate").disabled).toBe(false);
	ui.response("/generations", {
		job: {
			id: "upload-job",
			state: "FAILED",
			errorCode: "FIXTURE_STOP",
			imageUrl: null,
		},
	});
	await ui.evaluate("generateSelection(selected)");
	const payload = JSON.parse(ui.writes.at(-1)?.body ?? "{}");
	expect(referenceGenerationRequestSchema.safeParse(payload).success).toBe(
		true,
	);
	expect(payload).toMatchObject({
		schemaVersion: 2,
		sheetId: source.sheetId,
		provider: "openai-compatible",
		inputMode: "reference-img2img",
		sourceSelection: {
			kind: "selected",
			personId: source.personId,
			sourceSHA256: image,
		},
		explicitEdits: [
			{ field: "outfit.upper.color", operation: "replace", value: "dark blue" },
		],
	});
	expect(payload.personId).toBeUndefined();
	ui.byId("generation-mode").value = "token-only";
	await ui.byId("generation-mode").fire("change");
	expect(ui.evaluate("selected.sourceSelection")).toEqual({
		kind: "intentional-absence",
		reason: "no-reference-available",
	});
	expect(ui.evaluate("referenceInputReady()")).toBe(true);
	ui.evaluate('selected.source.characterId="historical-character";');
	await ui.evaluate("acquireSelectedReference()");
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.byId("generation-message").textContent).toContain(
		"UPLOADED_REFERENCE_IDENTITY_UNSUPPORTED",
	);
	await ui.evaluate("generateSelection(selected)");
	expect(
		ui.writes.filter((write) => write.url.endsWith("/generations")),
	).toHaveLength(1);
	expect(ui.requests.some((url) => url.includes("/wiki/people/"))).toBe(false);
});

test("active sheet waits for decode, rejects decode failure, and ignores stale completion after logout", async () => {
	const ui = await client();
	const bytes = new Uint8Array([137, 80, 78, 71]);
	const source = {
		...wikiPerson("person-1003"),
		imageBase64: Buffer.from(bytes).toString("base64"),
		sourceHashes: { image: createHash("sha256").update(bytes).digest("hex") },
	};
	ui.response("/wiki/people/person-1003", source);
	const reached = deferred<void>();
	const decode = deferred<void>();
	ui.byId("portrait").imageLoad = () => {
		reached.resolve();
		return decode.promise;
	};
	const selecting = ui.evaluate('selectWiki("person-1003")');
	await reached.promise;
	expect(ui.byId("active-image-status").dataset.state).toBe("loading");
	decode.reject(new Error("invalid PNG"));
	await selecting;
	expect(ui.byId("active-image-status").dataset.state).toBe("error");
	const late = deferred<void>();
	const started = deferred<void>();
	ui.byId("portrait").imageLoad = () => {
		started.resolve();
		return late.promise;
	};
	const stale = ui.evaluate('selectWiki("person-1003")');
	await started.promise;
	ui.evaluate("epoch++; clearProtected()");
	late.resolve();
	await stale;
	expect(ui.byId("active-image-status").dataset.state).toBe("missing");
	expect(ui.byId("active-sheet").dataset.kind).toBe("none");
	expect(ui.writes).toEqual([]);
});

test("active sheet reports failed image verification and preserves binding after rejected manual upload", async () => {
	const ui = await client();
	const source = {
		...wikiPerson("person-1003"),
		imageBase64: "iVBORw==",
		sourceHashes: {
			detail: "d".repeat(64),
			token: "b".repeat(64),
			image: "0".repeat(64),
		},
	};
	ui.response("/wiki/people/person-1003", source);
	await ui.evaluate('selectWiki("person-1003")');
	expect(ui.byId("active-image-status").dataset.state).toBe("error");
	expect(ui.byId("portrait").hidden).toBe(true);
	expect(ui.byId("active-image-hash").textContent).toBe(
		source.sourceHashes.image,
	);
	ui.byId("detail-file").files = [new File(["{}"], "detail.json")];
	ui.byId("token-file").files = [new File(["{}"], "token.json")];
	ui.byId("image-file").files = [new File(["bad"], "image.png")];
	const rejected = ui.hold("/sheets");
	const applying = ui.byId("upload-form").fire("submit");
	await rejected.requested;
	rejected.resolve(Response.json({ error: "INVALID_PNG" }, { status: 400 }));
	await applying;
	expect(ui.evaluate("selected.source")).toEqual(source);
	expect(ui.byId("active-sheet").dataset.kind).toBe("wiki");
	expect(ui.byId("active-image-status").dataset.state).toBe("error");
	expect(ui.byId("upload-errors").hidden).toBe(false);
});

test("stale single detail responses leave selection and draft intact without generation", async () => {
	const ui = await client();
	const old = ui.hold("/wiki/people/old");
	ui.response("/wiki/people/new", wikiPerson("new"));
	const selecting = ui.evaluate('selectWiki("old")');
	await old.requested;
	await ui.evaluate('selectWiki("new")');
	const status = ui.byId("wiki-status").textContent;
	old.resolve(Response.json(wikiPerson("old")));
	await selecting;
	expect(ui.evaluate("selected.personId")).toBe("new");
	expect(ui.byId("wiki-status").textContent).toBe(status);
	ui.prepare("A");
	await ui.select("A");
	ui.byId("notes-identity-and-face").value = "retained";
	await ui.byId("notes-identity-and-face").fire("input");
	await ui.evaluate('selectWiki("old")');
	expect(ui.byId("dirty-dialog").open).toBe(true);
	await ui.byId("draft-continue").click();
	expect(ui.evaluate("selected.personId")).toBe("new");
	expect(ui.byId("notes-identity-and-face").value).toBe("retained");
	expect(ui.writes.length).toBe(0);
});

test("captured comparison preserves job identity, draft, and action counts", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	expect(ui.requests.indexOf("/tools/api/jobs/A/result")).toBeLessThan(
		ui.requests.indexOf("/tools/api/jobs/A/captured-source"),
	);
	expect(ui.byId("source-image").dataset.sha).toBe(ui.captured("A").imageSHA);
	ui.byId("notes-identity-and-face").value = "retained";
	await ui.byId("notes-identity-and-face").fire("input");
	const requests = ui.requests.length;
	for (const mode of ["original", "side-by-side", "overlay", "result"]) {
		await ui.byId(`compare-${mode}`).click();
		expect(ui.byId("comparison-images").dataset.mode).toBe(mode);
	}
	await ui.byId("compare-overlay").click();
	for (const opacity of [0, 50, 100]) {
		ui.byId("result-opacity").value = String(opacity);
		await ui.byId("result-opacity").fire("input");
		expect(ui.byId("overlay-result").getAttribute("style")).toContain(
			`opacity: ${opacity / 100}`,
		);
		expect(ui.byId("result-opacity-value").textContent).toBe(`${opacity}%`);
	}
	expect(ui.byId("overlay-source").getAttribute("src")).toBe(
		ui.byId("source-image").getAttribute("src"),
	);
	expect(ui.requests.length).toBe(requests);
	expect(ui.writes.length).toBe(0);
	expect(ui.byId("notes-identity-and-face").value).toBe("retained");
	ui.byId("notes-identity-and-face").value = "";
	await ui.byId("notes-identity-and-face").fire("input");
	await ui.select("B");
	expect(ui.byId("result-opacity").value).toBe("50");
	expect(ui.byId("overlay-source").dataset.jobId).toBe("B");
	expect(ui.evaluate("knownResults.size")).toBe(2);
	expect(ui.byId("review-results").children.length).toBe(2);
});

test("overlay keeps unequal pixel extents at one origin without fitting each layer", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	ui.evaluate(
		"comparisonSourceSize = [800,1200]; comparisonResultSize = [1024,1536]",
	);
	await ui.byId("compare-overlay").click();
	expect(ui.byId("overlay-stage").getAttribute("style")).toContain(
		"1024 / 1536",
	);
	expect(ui.byId("overlay-source").getAttribute("style")).toBe(
		"width: 78.125%; height: 78.125%",
	);
	expect(ui.byId("overlay-result").getAttribute("style")).toBe(
		"width: 100%; height: 100%; opacity: 0.5",
	);
	expect(ui.byId("overlay-caption").textContent).toContain("크기 불일치");
	ui.evaluate("clearProtected()");
	expect(ui.byId("overlay-source").getAttribute("src")).toBeNull();
	expect(ui.byId("overlay-result").getAttribute("src")).toBeNull();
	expect(ui.byId("compare-overlay").disabled).toBe(true);
});

test("fresh history retains two same-person UUIDs with deterministic time and selection", async () => {
	for (let reload = 0; reload < 2; reload++) {
		const ui = await client();
		const source = ui.captured("A").identity;
		ui.response("/jobs", {
			history: [
				{ job: { id: "B", state: "HOLD" }, source, createdAt: null },
				{
					job: { id: "C", state: "RUNNING" },
					source: { ...source, personId: "other" },
					createdAt: "2026-10-15T00:00:00.000Z",
				},
				{
					job: { id: "A", state: "HOLD" },
					source,
					createdAt: "2026-10-14T00:00:00.000Z",
				},
				{ job: { id: "D", state: "FAILED" }, source: null, createdAt: null },
			],
		});
		await ui.evaluate("loadJobHistory()");
		expect(ui.evaluate("knownResults.size")).toBe(0);
		expect(ui.evaluate("jobHistory.map(entry => entry.job.id).join(',')")).toBe(
			"C,A,B,D",
		);
		ui.byId("history-person").value = "person";
		await ui.byId("history-person").fire("change");
		expect(ui.byId("person-history").children.length).toBe(1);
		const jobs = ui.byId("person-history").children[0]?.children[1];
		expect(jobs?.children.length).toBe(2);
		expect(jobs?.children[1]?.textContent).toContain("시간 미확인");
		for (const button of jobs?.children ?? []) {
			expect(button.dataset.kind).toBe("portrait");
			expect(button.dataset.reviewAuthority).toBe("owner");
			expect(button.textContent).toContain("초상 / 작업");
			expect(button.textContent).toContain("소유자 검토");
		}
		for (const id of ["A", "B"]) {
			ui.prepare(id);
			await ui.evaluate(
				`selectHistoryJob(jobHistory.find(entry => entry.job.id === "${id}"))`,
			);
			expect(ui.byId("overlay-source").dataset.jobId).toBe(id);
			expect(
				(
					ui.byId("person-history").children[0]?.children[1]?.children ?? []
				).filter((node) => node.getAttribute("aria-pressed") === "true").length,
			).toBe(1);
		}
		expect(ui.writes).toHaveLength(0);
	}
});

for (const field of [
	"schema",
	"ownerId",
	"jobId",
	"batchId",
	"itemId",
	"snapshotSHA",
	"imageSHA",
	"imageBase64",
] as const) {
	test(`captured source rejects mismatched ${field} without blocking result review`, async () => {
		const ui = await client();
		ui.prepare("A");
		ui.response("/jobs/A/captured-source", {
			source: { ...ui.captured("A"), [field]: "invalid" },
		});
		await ui.select("A");
		expect(ui.byId("source-image").hidden).toBe(true);
		expect(ui.byId("compare-original").disabled).toBe(true);
		expect(ui.byId("compare-overlay").disabled).toBe(true);
		expect(ui.byId("result-opacity").disabled).toBe(true);
		expect(ui.byId("result-image").hidden).toBe(false);
		expect(ui.byId("evaluation-fields").disabled).toBe(false);
		expect(ui.byId("comparison-message").getAttribute("role")).toBe("alert");
	});
}
for (const stale of ["success", "error"] as const) {
	test(`stale captured source A ${stale} and finally cannot replace B`, async () => {
		const ui = await client();
		ui.prepare("A");
		ui.prepare("B");
		const source = ui.hold("/jobs/A/captured-source");
		const a = ui.select("A");
		await source.requested;
		await ui.select("B");
		if (stale === "success")
			source.resolve(Response.json({ source: ui.captured("A") }));
		else source.reject(new Error("unavailable"));
		await a;
		expect(ui.byId("source-image").dataset.jobId).toBe("B");
		expect(ui.evaluate("sourcePending")).toBe(false);
		expect(ui.byId("comparison-message").getAttribute("role")).toBe("status");
	});
}
test("token-only captured source is valid absence while result evaluation stays enabled", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.response("/jobs/A/captured-source", {
		source: { ...ui.captured("A"), imageBase64: null, imageSHA: null },
	});
	await ui.select("A");
	expect(ui.byId("result-image").hidden).toBe(false);
	expect(ui.byId("source-image").hidden).toBe(true);
	expect(ui.byId("evaluation-fields").disabled).toBe(false);
	expect(ui.byId("comparison-message").getAttribute("role")).toBe("status");
	expect(ui.writes).toHaveLength(0);
});

test("unavailable captured source retries without writes and releases its URLs", async () => {
	const ui = await client();
	ui.prepare("A");
	const source = ui.hold("/jobs/A/captured-source");
	const read = ui.select("A");
	await source.requested;
	source.reject(new Error("unavailable"));
	await read;
	expect(ui.byId("result-image").hidden).toBe(false);
	ui.response("/jobs/A/captured-source", { source: ui.captured("A") });
	await ui.byId("retry-source").click();
	expect(ui.byId("source-image").hidden).toBe(false);
	ui.evaluate("clearProtected()");
	expect(ui.byId("source-image").hidden).toBe(true);
	expect(ui.evaluate("knownResults.size")).toBe(0);
	expect(ui.revoked.length).toBeGreaterThanOrEqual(3);
	expect(ui.writes.length).toBe(0);
});
test("result decode failure blocks saving and source reads", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.failDecode();
	await ui.select("A");
	expect(ui.byId("evaluation-fields").disabled).toBe(true);
	expect(ui.requests).not.toContain("/tools/api/jobs/A/captured-source");
	expect(ui.revoked.length).toBeGreaterThan(0);
});
test("source hash and decode failures hide source while preserving verified result", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.response("/jobs/A/captured-source", {
		source: { ...ui.captured("A"), imageSHA: "0".repeat(64) },
	});
	await ui.select("A");
	expect(ui.byId("source-image").hidden).toBe(true);
	expect(ui.byId("comparison-message").textContent).toContain(
		"SOURCE_HASH_MISMATCH",
	);
	ui.response("/jobs/A/captured-source", { source: ui.captured("A") });
	ui.failDecode();
	await ui.byId("retry-source").click();
	expect(ui.byId("comparison-message").textContent).toContain(
		"IMAGE_DECODE_FAILED",
	);
	expect(ui.byId("source-image").hidden).toBe(true);
	expect(ui.byId("evaluation-fields").disabled).toBe(false);
});
test("generation selector changes retain captured review A and its draft", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	ui.byId("notes-identity-and-face").value = "A retained";
	await ui.byId("notes-identity-and-face").fire("input");
	ui.response("/characters/B", {
		personId: "B",
		detail: {},
		token: {},
		name: "live B",
		sourceHashes: {},
	});
	// No live image URL: this changes the generation selection, not review evidence.
	await ui.evaluate('selectCharacter("B")');
	await ui.byId("draft-keep").click();
	expect(ui.evaluate("selected.personId")).toBe("B");
	expect(ui.evaluate("reviewBinding.jobId")).toBe("A");
	expect(ui.byId("source-image").dataset.jobId).toBe("A");
	expect(ui.byId("notes-identity-and-face").value).toBe("A retained");
	expect(ui.writes.length).toBe(0);
});

for (const stale of ["success", "error"] as const) {
	test(`actual client ignores stale review A ${stale} after B binds`, async () => {
		const ui = await client();
		ui.prepare("A");
		ui.prepare("B");
		const a = ui.hold("/jobs/A/result");
		const readA = ui.select("A");
		await a.requested;
		await ui.select("B");
		ui.byId("notes-identity-and-face").value = "B retained";
		if (stale === "success")
			a.resolve(Response.json({ result: ui.result("A") }));
		else a.reject(new Error("stale review error"));
		await readA;
		expect(ui.evaluate("reviewBinding.jobId")).toBe("B");
		expect(ui.byId("notes-identity-and-face").value).toBe("B retained");
		expect(ui.evaluate("reviewPending")).toBe(false);
		expect(ui.byId("evaluation-fields").disabled).toBe(false);
	});

	test(`actual client ignores stale A ${stale} and finally after B selection`, async () => {
		const ui = await client();
		ui.prepare("A");
		ui.prepare("B");
		const a = ui.hold("/jobs/A");
		const b = ui.hold("/jobs/B");
		const readA = ui.select("A");
		const readB = ui.select("B");
		b.resolve(
			Response.json({
				job: { id: "B", state: "HOLD", imageUrl: "/tools/api/jobs/B/image" },
			}),
		);
		await readB;
		ui.byId("notes-identity-and-face").value = "B retained";
		if (stale === "success")
			a.resolve(Response.json({ job: { id: "A", state: "HOLD" } }));
		else a.reject(new Error("stale error"));
		await readA;
		expect(ui.evaluate("reviewBinding.jobId")).toBe("B");
		expect(ui.byId("notes-identity-and-face").value).toBe("B retained");
		expect(ui.byId("evaluation-fields").disabled).toBe(false);
		expect(ui.evaluate("resultPending")).toBe(false);
	});
}

test("stale A finally cannot release B while B is pending", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	const a = ui.hold("/jobs/A");
	const b = ui.hold("/jobs/B");
	const readA = ui.select("A");
	const readB = ui.select("B");
	a.reject(new Error("stale"));
	await readA;
	expect(ui.evaluate("resultPending")).toBe(true);
	expect(ui.byId("refresh-job").disabled).toBe(true);
	b.resolve(
		Response.json({
			job: { id: "B", state: "HOLD", imageUrl: "/tools/api/jobs/B/image" },
		}),
	);
	await readB;
	expect(ui.evaluate("reviewBinding.jobId")).toBe("B");
});

test("same result selection and status refresh preserve the editor; identical PNG jobs reset explicitly", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	const editor = ui.byId("notes-identity-and-face");
	editor.value = "A retained";
	const before = ui.requests.length;
	await ui.select("A");
	expect(ui.requests.length).toBe(before);
	await ui.byId("refresh-job").fire("click");
	expect(editor.value).toBe("A retained");
	await ui.byId("load-review").fire("click");
	expect(ui.byId("notes-identity-and-face")).toBe(editor);
	expect(editor.value).toBe("A retained");
	ui.evaluate("clearPreview()");
	expect(editor.value).toBe("A retained");
	expect(ui.evaluate("reviewBinding.jobId")).toBe("A");
	expect(ui.revoked.length).toBeGreaterThan(0);
	await ui.select("B");
	await ui.byId("draft-discard").fire("click");
	expect(ui.evaluate("reviewBinding.jobId")).toBe("B");
	expect(editor.value).toBe("");
	expect(
		ui.requests.filter((url) => url.endsWith("/generations")),
	).toHaveLength(0);
	ui.evaluate("clearProtected()");
	expect(ui.evaluate("reviewBinding")).toBeNull();
	expect(ui.byId("evaluation-fields").disabled).toBe(true);
});

test("actual client keeps, cancels and discards independent same-PNG drafts", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	ui.byId("notes-identity-and-face").value = "A retained 메모";
	await ui.select("B");
	expect(ui.byId("dirty-dialog").open).toBe(true);
	await ui.byId("draft-continue").fire("click");
	expect(ui.evaluate("reviewBinding.jobId")).toBe("A");
	await ui.select("B");
	await ui.byId("draft-keep").fire("click");
	expect(ui.byId("notes-identity-and-face").value).toBe("");
	await ui.select("A");
	expect(ui.byId("notes-identity-and-face").value).toBe("A retained 메모");
	await ui.select("B");
	await ui.byId("draft-discard").fire("click");
	await ui.select("A");
	expect(ui.byId("notes-identity-and-face").value).toBe("");
	expect(ui.writes).toHaveLength(0);
});

test("task destinations are frozen and theme preserves the single editor and selection", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	const editor = ui.byId("notes-identity-and-face");
	editor.value = "retained across tasks";
	ui.byId("wiki-query").value = "QA query";
	ui.evaluate('batchSelection.set("person-1003", {personId:"person-1003"})');
	const before = ui.requests.length;
	await ui.byId("task-single").fire("click");
	expect(ui.byId("dirty-dialog").open).toBe(true);
	await ui.byId("task-queue").fire("click");
	await ui.byId("draft-continue").fire("click");
	expect(ui.evaluate("activeTask")).toBe("review");
	await ui.byId("task-single").fire("click");
	await ui.byId("draft-keep").fire("click");
	expect(ui.evaluate("activeTask")).toBe("single");
	expect(ui.byId("review-editor").hidden).toBe(true);
	ui.byId("theme").value = "dark";
	await ui.byId("theme").fire("change");
	await ui.byId("task-review").fire("click");
	expect(ui.byId("notes-identity-and-face")).toBe(editor);
	expect(editor.value).toBe("retained across tasks");
	expect(ui.byId("wiki-query").value).toBe("QA query");
	expect(ui.evaluate("batchSelection.size")).toBe(1);
	expect(ui.evaluate("reviewBinding.jobId")).toBe("A");
	expect(ui.byId("task-review").getAttribute("aria-current")).toBe("page");
	expect(ui.requests.length).toBe(before);
	expect(ui.writes).toHaveLength(0);
});

function writeBody(ui: Awaited<ReturnType<typeof client>>, index: number) {
	const write = ui.writes[index];
	if (!write) throw new Error("Expected evaluation request");
	return write.body;
}
function saved(
	ui: Awaited<ReturnType<typeof client>>,
	id: string,
	payload: { expectedRevision: number } & Record<string, unknown>,
) {
	const binding = ui.result(id);
	return {
		...binding,
		schema: "portal-result-evaluation.v1",
		machineMetricsSHA: binding.machineEvidence.metricsSHA,
		...payload,
		previousRevision: payload.expectedRevision,
		revision: Number(payload.expectedRevision) + 1,
		reviewerId: "1",
		reviewedAt: "2026-10-14T00:00:00.000Z",
		approval: "NONE",
	};
}
function history(
	ui: Awaited<ReturnType<typeof client>>,
	id: string,
	records: unknown[],
) {
	ui.response(`/jobs/${id}/evaluations`, {
		resultBinding: ui.result(id),
		machineEvidence: ui.result(id).machineEvidence,
		latest: records.at(-1) ?? null,
		history: records,
	});
}

test("late originating save confirms exact content while post-submit edits remain dirty", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "attempt";
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	const payload = JSON.parse(writeBody(ui, 0));
	ui.byId("evaluation-notes").value = "post-submit edit";
	await ui.select("B");
	await ui.byId("draft-keep").fire("click");
	const evaluation = saved(ui, "A", payload);
	history(ui, "A", [evaluation]);
	post.resolve(Response.json({ evaluation }));
	await sending;
	expect(ui.evaluate("reviewBinding.jobId")).toBe("B");
	await ui.select("A");
	expect(ui.byId("evaluation-notes").value).toBe("post-submit edit");
	expect(ui.evaluate("reviewDraft.baseline.notes")).toBe("attempt");
	expect(ui.evaluate("draftDirty()")).toBe(true);
	expect(ui.evaluate("reviewDraft.attempt")).toBeNull();
});

test("uncertain absent ID remains locked and exact replay ignores newer displayed revision", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "original";
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	const bytes = writeBody(ui, 0);
	const payload = JSON.parse(bytes);
	ui.byId("evaluation-notes").value = "additional edits";
	post.reject(new Error("response lost"));
	await sending;
	const competitor = saved(ui, "A", {
		...payload,
		evaluationId: "competitor",
		notes: "competitor",
	});
	history(ui, "A", [competitor]);
	await ui.byId("load-review").fire("click");
	expect(ui.evaluate("reviewDraft.attempt.state")).toBe("uncertain");
	expect(ui.byId("save-evaluation").disabled).toBe(true);
	expect(ui.evaluate("reviewDraft.baseRevision")).toBe(0);
	const retry = ui.hold("/jobs/A/evaluations");
	const replay = ui.byId("retry-evaluation").fire("click");
	await retry.requested;
	expect(writeBody(ui, 1)).toBe(bytes);
	retry.reject(new Error("still uncertain"));
	await replay;
	expect(ui.byId("evaluation-notes").value).toBe("additional edits");
});

test("lost committed response and newer history preserve attempted base and later edits", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "original";
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	const payload = JSON.parse(writeBody(ui, 0));
	ui.byId("evaluation-notes").value = "later";
	post.reject(new Error("lost"));
	await sending;
	const one = saved(ui, "A", payload);
	const two = saved(ui, "A", {
		...payload,
		evaluationId: "newer",
		expectedRevision: 1,
		notes: "newer",
	});
	history(ui, "A", [one, two]);
	await ui.byId("load-review").fire("click");
	expect(ui.evaluate("reviewDraft.baseRevision")).toBe(1);
	expect(ui.evaluate("reviewDraft.latestObservedRevision")).toBe(2);
	expect(ui.byId("evaluation-notes").value).toBe("later");
	expect(ui.evaluate("reviewDraft.baseline.notes")).toBe("original");
});

test("CAS refresh preserves edits and requires another explicit Save", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "draft";
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	const payload = JSON.parse(writeBody(ui, 0));
	history(ui, "A", [
		saved(ui, "A", { ...payload, evaluationId: "other", notes: "other" }),
	]);
	post.resolve(
		Response.json(
			{ error: { code: "EVALUATION_REVISION_CONFLICT" } },
			{ status: 409 },
		),
	);
	await sending;
	expect(ui.byId("evaluation-notes").value).toBe("draft");
	expect(ui.writes).toHaveLength(1);
	expect(ui.evaluate("reviewDraft.baseRevision")).toBe(1);
	expect(ui.byId("save-evaluation").disabled).toBe(false);
});

test("matching ID with changed content locks unresolved attempt", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	const payload = JSON.parse(writeBody(ui, 0));
	post.reject(new Error("lost"));
	await sending;
	history(ui, "A", [saved(ui, "A", { ...payload, notes: "forged" })]);
	await ui.byId("load-review").fire("click");
	expect(ui.byId("evaluation-fields").disabled).toBe(true);
	expect(ui.evaluate("reviewDraft.attempt.state")).toBe("uncertain");
});

test("forced 401 clears all protected drafts and late save cannot restore them", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	const payload = JSON.parse(writeBody(ui, 0));
	const read = ui.hold("/jobs/A/result");
	const loading = ui.byId("load-review").fire("click");
	await read.requested;
	read.resolve(Response.json({}, { status: 401 }));
	await loading;
	post.resolve(Response.json({ evaluation: saved(ui, "A", payload) }));
	await sending;
	expect(ui.evaluate("epoch")).toBe(1);
	expect(ui.evaluate("resultDrafts.size")).toBe(0);
	expect(ui.evaluate("reviewBinding")).toBeNull();
});

test("Unicode limits count code points and submit rejects bypasses and blank required notes", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	const category = ui.byId("notes-identity-and-face");
	category.value = "😀".repeat(2001);
	await category.fire("input");
	expect(Array.from(category.value)).toHaveLength(2000);
	const overall = ui.byId("evaluation-notes");
	overall.value = "😀".repeat(8001);
	await overall.fire("input");
	expect(Array.from(overall.value)).toHaveLength(8000);
	overall.value += "😀";
	await ui.byId("evaluation-form").fire("submit");
	expect(ui.writes).toHaveLength(0);
	overall.value = "";
	category.value = " ";
	ui.byId("category-identity-and-face").value = "needs-change";
	await ui.byId("evaluation-form").fire("submit");
	expect(ui.writes).toHaveLength(0);
});

test("target load failure retains A draft and restoration revalidates the binding", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "A safe";
	const target = ui.hold("/jobs/B");
	target.reject(new Error("target unavailable"));
	await ui.select("B");
	await ui.byId("draft-keep").fire("click");
	await ui.select("A");
	expect(ui.byId("evaluation-notes").value).toBe("A safe");
	ui.response("/jobs/A/result", {
		result: { ...ui.result("A"), receiptSHA: "e".repeat(64) },
	});
	await ui.byId("load-review").fire("click");
	expect(ui.byId("save-evaluation").disabled).toBe(true);
	expect(ui.byId("evaluation-notes").value).toBe("A safe");
});

test("uncertain A remains immutable after discard while verified B can edit and save", async () => {
	const ui = await client();
	ui.prepare("A");
	ui.prepare("B");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "attempt";
	const post = ui.hold("/jobs/A/evaluations");
	const sending = ui.byId("evaluation-form").fire("submit");
	await post.requested;
	post.reject(new Error("lost"));
	await sending;
	const bytes = writeBody(ui, 0);
	await ui.select("B");
	await ui.byId("draft-discard").fire("click");
	expect(ui.byId("save-evaluation").disabled).toBe(false);
	ui.byId("evaluation-notes").value = "B isolated save";
	const postB = ui.hold("/jobs/B/evaluations");
	const savingB = ui.byId("evaluation-form").fire("submit");
	await postB.requested;
	const payloadB = JSON.parse(writeBody(ui, 1));
	const evaluationB = saved(ui, "B", payloadB);
	history(ui, "B", [evaluationB]);
	postB.resolve(Response.json({ evaluation: evaluationB }));
	await savingB;
	expect(ui.writes).toHaveLength(2);
	expect(ui.evaluate("reviewDraft.baseline.notes")).toBe("B isolated save");
	expect(ui.evaluate("reviewDraft.attempt")).toBeNull();
	history(ui, "A", []);
	await ui.select("A");
	expect(ui.evaluate("reviewDraft.attempt.body")).toBe(bytes);
	expect(ui.byId("evaluation-notes").value).toBe("");
	expect(ui.byId("save-evaluation").disabled).toBe(true);
	const retry = ui.hold("/jobs/A/evaluations");
	const replay = ui.byId("retry-evaluation").fire("click");
	await retry.requested;
	expect(writeBody(ui, 2)).toBe(bytes);
	retry.reject(new Error("still uncertain"));
	await replay;
});

test("explicit logout allows continue or discard, never session-spanning keep", async () => {
	const ui = await client();
	ui.prepare("A");
	await ui.select("A");
	ui.byId("evaluation-notes").value = "private draft";
	await ui.byId("logout").fire("click");
	expect(ui.byId("dirty-dialog").open).toBe(true);
	expect(ui.byId("draft-keep").hidden).toBe(true);
	await ui.byId("draft-continue").fire("click");
	expect(ui.evaluate("resultDrafts.size")).toBe(1);
	ui.response("/auth/logout", {});
	await ui.byId("logout").fire("click");
	await ui.byId("draft-discard").fire("click");
	expect(ui.evaluate("resultDrafts.size")).toBe(0);
	expect(ui.evaluate("session")).toBeNull();
});

test("lost generation response follows the server job through RUNNING to its terminal state on job events without resubmitting; definitive rejections and missing jobs stop", async () => {
	const ui = await client();
	ui.response("/connections", {
		mode: "personal",
		endpoints: [],
		connection: {
			connectionId: "openai",
			endpointId: "local-openai",
			protocolVersion: "openai-compatible-http.v1",
			toolName: "openai-images-edits",
			state: "READY",
			expiresAt: Date.now() + 60000,
		},
		provider: {
			baseUrl: "http://127.0.0.1:8317/v1",
			model: "gpt-image-2.5-sunburst",
		},
		comfyui: {
			available: false,
			workflows: [],
			connection: null,
			readiness: null,
		},
	});
	ui.response("/jobs", { jobs: [], history: [], lease: {} });
	await ui.evaluate("loadConnections()");
	ui.evaluate(
		'openJobEvents(); activeTask = "single"; selected = {personId:"person-1003", eligible:true, sourceSelection:{kind:"selected",personId:"person-1003",sourceSHA256:"a".repeat(64)}, source:{sourceAcquisition:{status:"acquired"},name:"Fixture", characterId:"K1003", personId:"person-1003", sourceHashes:{detail:"a",token:"b",image:"a".repeat(64)}}}; updateAction();',
	);
	expect(ui.jobEvents.open()).toBe(1);
	expect(ui.byId("generate").disabled).toBe(false);
	const submit = async () => {
		const held = ui.hold("/generations");
		const run = ui.evaluate("generateSelection(selected)");
		await held.requested;
		const id: string = JSON.parse(ui.writes.at(-1)?.body ?? "{}").requestId;
		return { held, run, id };
	};
	const lookups = (id: string) =>
		ui.requests.filter((url) => url.endsWith(`/jobs/${id}`)).length;
	// A definitive 4xx rejection means no server job exists: nothing to follow.
	const rejected = await submit();
	rejected.held.resolve(
		Response.json({ error: { code: "INVALID_INPUT" } }, { status: 422 }),
	);
	await rejected.run;
	expect(lookups(rejected.id)).toBe(0);
	expect(ui.byId("preview-empty").textContent).toContain("미확인");
	expect(ui.evaluate("pending")).toBe(false);
	// The POST connection is cut while the server keeps running the job. The
	// client reads the job by id, stays pending through RUNNING, wakes on the
	// server job event, and displays the terminal result. One POST only.
	const lost = await submit();
	const running = ui.hold(`/jobs/${lost.id}`);
	lost.held.reject(new TypeError("Failed to fetch"));
	await running.requested;
	const shownRunning = ui.byId("preview-empty").nextTextChange();
	running.resolve(
		Response.json({
			job: {
				id: lost.id,
				state: "RUNNING",
				reviewStatus: "HOLD",
				imageUrl: null,
				metrics: null,
				errorCode: null,
			},
		}),
	);
	await shownRunning;
	expect(ui.byId("preview-empty").textContent).toContain("RUNNING");
	expect(ui.byId("preview-empty").textContent).toContain(
		"새 요청은 보내지 않습니다",
	);
	expect(ui.evaluate("activeJob.state")).toBe("RUNNING");
	expect(ui.evaluate("pending")).toBe(true);
	expect(ui.byId("generate").disabled).toBe(true);
	expect(lookups(lost.id)).toBe(1);
	ui.prepare(lost.id);
	ui.response("/jobs", {
		jobs: [],
		history: [
			{
				job: {
					id: lost.id,
					state: "HOLD",
					imageUrl: `/tools/api/jobs/${lost.id}/image`,
				},
				source: {
					personId: "person-1003",
					name: "Fixture",
					characterId: "K1003",
				},
				createdAt: "2026-10-19T00:00:00.000Z",
				providerModel: "gpt-image-2.5-sunburst",
			},
		],
		lease: {},
	});
	ui.jobEvents.emit();
	await lost.run;
	expect(ui.evaluate("activeJob.state")).toBe("HOLD");
	expect(ui.byId("portrait").hidden).toBe(false);
	expect(lookups(lost.id)).toBe(2);
	expect(
		ui.requests.filter((url) => url.endsWith(`/jobs/${lost.id}/image`)),
	).toHaveLength(1);
	expect(
		ui.requests.filter((url) => url.endsWith("/generations")),
	).toHaveLength(2);
	expect(ui.writes.filter((w) => w.url.endsWith("/generations"))).toHaveLength(
		2,
	);
	expect(ui.evaluate("pending")).toBe(false);
	expect(ui.byId("diagnostic").getAttribute("role")).not.toBe("alert");
	// A server that has no record of the job ends the follow without a resend.
	const missing = await submit();
	const absent = ui.hold(`/jobs/${missing.id}`);
	missing.held.reject(new TypeError("Failed to fetch"));
	await absent.requested;
	absent.resolve(
		Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 }),
	);
	await missing.run;
	expect(ui.byId("preview-empty").textContent).toContain(
		"작업 기록이 없습니다",
	);
	expect(ui.byId("diagnostic").getAttribute("role")).toBe("alert");
	expect(lookups(missing.id)).toBe(1);
	expect(ui.evaluate("pending")).toBe(false);
	expect(
		ui.requests.filter((url) => url.endsWith("/generations")),
	).toHaveLength(3);
	// Logout closes the stream and releases any follower.
	ui.evaluate("clearProtected()");
	expect(ui.jobEvents.open()).toBe(0);
});

test("ComfyUI connection card and provider select route one explicit request per provider without generating on selection", async () => {
	const ui = await client();
	const workflow = {
		id: "moss-image-sft-source-img2img.alpha.v1",
		providerModel: "comfyui:moss-image-sft-source-img2img.alpha.v1",
		label: "ComfyUI · MOSS-Image SFT 그림체 LoRA",
		limitations: "컴파일된 프롬프트만 전송. 참조 이미지 없음. SD3.5 자격 아님.",
	};
	const moss = {
		id: "moss-image-sft-text.v1",
		providerModel: "comfyui:moss-image-sft-text.v1",
		label: "ComfyUI · MOSS-Image SFT 텍스트→이미지",
		limitations: "공식 SFT 템플릿 원문 프롬프트 경로. 참조·스타일 이미지 없음.",
	};
	const openai = {
		connectionId: "openai",
		endpointId: "local-openai",
		protocolVersion: "openai-compatible-http.v1",
		toolName: "openai-images-edits",
		state: "READY",
		expiresAt: Date.now() + 60000,
	};
	ui.response("/connections", {
		mode: "personal",
		endpoints: [],
		connection: openai,
		provider: {
			baseUrl: "http://127.0.0.1:8317/v1",
			model: "gemini-3.1-flash-image",
		},
		comfyui: {
			available: true,
			workflows: [workflow, moss],
			connection: null,
			readiness: null,
		},
	});
	ui.response("/jobs", { jobs: [], history: [], lease: {} });
	await ui.evaluate("loadConnections()");
	expect(ui.byId("comfy-connection-panel").hidden).toBe(false);
	// Only MOSS is offered and preselected; selection never submits a request.
	expect(
		ui
			.byId("comfy-workflow")
			.children.map((node) => [node.value, node.textContent]),
	).toEqual(
		[workflow, moss].map((entry) => [entry.id, `${entry.label} · ${entry.id}`]),
	);
	expect(ui.byId("comfy-workflow").value).toBe(workflow.id);
	expect(ui.byId("comfy-workflow-limits").textContent).toBe(
		workflow.limitations,
	);
	const writesAtStart = ui.writes.length;
	ui.byId("comfy-workflow").value = moss.id;
	await ui.byId("comfy-workflow").fire("change");
	expect(ui.byId("comfy-workflow-limits").textContent).toBe(moss.limitations);
	expect(ui.writes.length).toBe(writesAtStart);
	ui.byId("comfy-workflow").value = workflow.id;
	await ui.byId("comfy-workflow").fire("change");
	expect(ui.byId("comfy-workflow-limits").textContent).toBe(
		workflow.limitations,
	);
	expect(ui.byId("comfy-connect").disabled).toBe(false);
	expect(ui.byId("comfy-disconnect").disabled).toBe(true);
	expect(
		ui.byId("generation-provider").children.map((node) => node.value),
	).toEqual(["openai-compatible", "comfyui"]);
	expect(ui.byId("generation-model").textContent).toBe(
		"gpt-image-2.5-sunburst",
	);
	expect(ui.byId("generation-model-note").textContent).toContain(
		"gemini-3.1-flash-image",
	);
	expect(ui.byId("comfy-generation-fields").hidden).toBe(true);
	ui.evaluate(
		'activeTask = "single"; selected = {personId:"person-1003", eligible:true, sourceSelection:{kind:"selected",personId:"person-1003",sourceSHA256:"a".repeat(64)}, source:{sourceAcquisition:{status:"acquired"},name:"Fixture", characterId:"K1003", sourceHashes:{detail:"a",token:"b",image:"a".repeat(64)}}}; updateAction();',
	);
	expect(ui.byId("generate").disabled).toBe(false);
	const writesBefore = ui.writes.length;
	expect(ui.byId("source-recipe-fields").hidden).toBe(true);
	ui.byId("generation-provider").value = "comfyui";
	await ui.byId("generation-provider").fire("change");
	expect(ui.writes.length).toBe(writesBefore);
	expect(ui.byId("source-recipe-fields").hidden).toBe(false);
	expect(ui.byId("source-recipe").children.map((node) => node.value)).toEqual([
		"source-025",
		"source-045",
		"source-065",
	]);
	ui.byId("source-recipe").value = "source-065";
	await ui.byId("source-recipe").fire("change");
	expect(ui.writes.length).toBe(writesBefore);
	expect(ui.byId("generation-model").textContent).toBe(workflow.providerModel);
	expect(
		ui.byId("generation-provider").children.map((node) => node.textContent),
	).toEqual(["OpenAI 호환 (CLIProxy) · 계정 연결", workflow.label]);
	expect(ui.byId("generation-provider-note").textContent).toBe(
		workflow.limitations,
	);
	expect(ui.byId("comfy-generation-fields").hidden).toBe(true);
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.byId("generation-message").textContent).toContain(
		"ComfyUI 연결이 READY여야",
	);
	const comfy = {
		connectionId: "comfy",
		endpointId: "comfyui",
		protocolVersion: "comfyui-http.v1",
		toolName: workflow.id,
		state: "READY",
		expiresAt: Date.now() + 60000,
	};
	ui.response("/connections", {
		connection: comfy,
		readiness: {
			state: "READY",
			workflow: workflow.id,
			models: {
				diffusion: "moss_image_sft_int8_convrot.safetensors",
				encoder: "qwen",
				vae: "ae",
			},
		},
	});
	await ui.byId("comfy-connect").fire("click");
	expect(JSON.parse(ui.writes.at(-1)?.body ?? "{}")).toEqual({
		provider: "comfyui",
		workflow: workflow.id,
	});
	expect(ui.byId("comfy-status").textContent).toContain("READY");
	expect(ui.byId("comfy-status").textContent).toContain(
		"moss_image_sft_int8_convrot.safetensors",
	);
	expect(ui.byId("comfy-connect").disabled).toBe(true);
	expect(ui.byId("comfy-disconnect").disabled).toBe(false);
	expect(ui.byId("generate").disabled).toBe(false);
	// A fresh page may initially select the first workflow while the server
	// restores an existing MOSS connection. The disabled selector must name
	// that actual binding, not the first workflow.
	await ui.evaluate(
		`comfyConnection = ${JSON.stringify({ ...comfy, toolName: moss.id, endpointId: "comfyui-moss" })}; renderComfyConnection();`,
	);
	expect(ui.byId("comfy-workflow").value).toBe(moss.id);
	expect(ui.byId("comfy-workflow").disabled).toBe(true);
	await ui.evaluate(
		`comfyConnection = ${JSON.stringify(comfy)}; renderComfyConnection();`,
	);
	expect(
		ui.requests.filter((url) => url.endsWith("/generations")),
	).toHaveLength(0);
	ui.byId("upper-color").value = "red";
	await ui.evaluate("generateSelection(selected)");
	expect(
		ui.requests.filter((url) => url.endsWith("/generations")),
	).toHaveLength(0);
	ui.byId("upper-color").value = "dark blue";
	const generate = async (job: Record<string, unknown>) => {
		const held = ui.hold("/generations");
		const run = ui.evaluate("generateSelection(selected)");
		await held.requested;
		const payload = JSON.parse(ui.writes.at(-1)?.body ?? "{}");
		held.resolve(Response.json({ job: { ...job, id: payload.requestId } }));
		await run;
		return payload;
	};
	const comfyPayload = await generate({
		state: "FAILED",
		imageUrl: null,
		metrics: null,
		errorCode: "COMFY_EXECUTION_FAILED",
		reviewStatus: "HOLD",
	});
	expect(comfyPayload).toMatchObject({
		sourceRecipe: "source-065",
		connectionId: "comfy",
		personId: "person-1003",
		providerModel: workflow.providerModel,
		schemaVersion: 2,
		inputMode: "reference-img2img",
		explicitEdits: [
			{ field: "outfit.upper.color", operation: "replace", value: "dark blue" },
		],
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	});
	expect(comfyPayload.requestId).toMatch(/^[0-9a-f-]{36}$/);
	expect(
		ui
			.byId("receipt")
			.querySelectorAll("p")
			.map((node) => node.textContent),
	).toContain(
		`요청 프로바이더: ComfyUI 원본 latent 편집 · ${workflow.providerModel} · 품질 미승인`,
	);
	ui.byId("generation-provider").value = "openai-compatible";
	await ui.byId("generation-provider").fire("change");
	expect(ui.byId("generation-model").textContent).toBe(
		"gpt-image-2.5-sunburst",
	);
	const gptPayload = await generate({
		state: "FAILED",
		imageUrl: null,
		metrics: null,
		errorCode: "LOCAL_HTTP_FAILURE",
		reviewStatus: "HOLD",
	});
	expect(gptPayload).toMatchObject({
		connectionId: "openai",
		providerModel: "gpt-image-2.5-sunburst",
	});
	expect("seed" in gptPayload).toBe(false);
	expect("sourceRecipe" in gptPayload).toBe(false);
	expect(ui.byId("source-recipe-fields").hidden).toBe(true);
	expect(
		ui
			.byId("receipt")
			.querySelectorAll("p")
			.map((node) => node.textContent),
	).toContain(
		"요청 프로바이더: OpenAI 호환 (CLIProxy) · gpt-image-2.5-sunburst",
	);
	ui.response("/connections/comfy", {
		connection: { ...comfy, state: "REVOKED" },
	});
	await ui.byId("comfy-disconnect").fire("click");
	expect(ui.byId("comfy-status").textContent).toContain("REVOKED");
	expect(ui.byId("comfy-connect").disabled).toBe(false);
	ui.evaluate("clearProtected()");
	expect(ui.byId("comfy-connection-panel").hidden).toBe(true);
	expect(
		ui.byId("generation-provider").children.map((node) => node.value),
	).toEqual(["openai-compatible"]);
	expect(ui.byId("generation-seed").value).toBe("");
});

test("history arriving during result verification preserves the bound review operation", async () => {
	const ui = await client();
	ui.prepare("history-race");
	const held = ui.hold("/jobs/history-race/evaluations");
	const selection = ui.select("history-race");
	await held.requested;
	ui.response("/jobs", {
		history: [
			{
				job: {
					id: "history-race",
					state: "HOLD",
					imageUrl: "/tools/api/jobs/history-race/image",
				},
				source: { personId: "person", name: "History" },
			},
		],
		lease: {},
	});
	await ui.evaluate("loadJobHistory()");
	held.resolve(
		Response.json({
			resultBinding: ui.result("history-race"),
			machineEvidence: ui.result("history-race").machineEvidence,
			latest: null,
			history: [],
		}),
	);
	await selection;
	expect(ui.evaluate("reviewPending")).toBe(false);
	expect(ui.evaluate("reviewBinding.jobId")).toBe("history-race");
	expect(ui.byId("compare-result").disabled).toBe(false);
});

test("v2 source failure stays reference, explicit absence selects MOSS, stale acquisition cannot replace selection", async () => {
	const arrivals = deferred<void>();
	const answer = deferred<Response>();
	const ui = await client(async (url) => {
		if (url.includes("schemaVersion=2")) {
			arrivals.resolve();
			return answer.promise;
		}
		throw Error(`Unexpected request ${url}`);
	});
	ui.evaluate(
		'connection={state:"READY",expiresAt:Date.now()+60000,connectionId:"cpa"}; selected={personId:"person-0998",eligible:true,source:{sourceHashes:{image:"a".repeat(64)}}};',
	);
	const acquiring = ui.evaluate("acquireSelectedReference()");
	await arrivals.promise;
	expect(ui.byId("generate").disabled).toBe(true);
	answer.resolve(
		Response.json({
			sourceAcquisition: {
				status: "failed",
				eligible: false,
				errorCode: "REFERENCE_NOT_ACQUIRED",
			},
		}),
	);
	await acquiring;
	expect(ui.evaluate("generationMode")).toBe("reference-img2img");
	expect(ui.byId("reference-absence").checked).toBe(false);
	expect(ui.byId("generate").disabled).toBe(true);
	expect(ui.writes).toHaveLength(0);
	const absence = await client();
	absence.evaluate(
		'comfyAvailable=true; generationMode="token-only"; generationProvider="comfyui"; selected={personId:"person-900001",eligible:true,source:{sourceHashes:{image:null}}}; $("reference-absence").checked=true; comfyConnection={state:"READY",expiresAt:Date.now()+60000,connectionId:"moss",toolName:"moss-image-sft-style-male.alpha.v1"};',
	);
	const path =
		"/wiki/people/person-900001?" +
		new URLSearchParams({
			schemaVersion: "2",
			inputMode: "token-only",
			sourceSelection: JSON.stringify({
				kind: "intentional-absence",
				reason: "no-reference-available",
			}),
		});
	absence.response(path, {
		sourceAcquisition: { status: "intentional-absence", eligible: true },
		imageBase64: null,
	});
	await absence.evaluate("acquireSelectedReference()");
	expect(absence.evaluate("referenceInputReady()")).toBe(true);
	expect(absence.byId("generation-model").textContent).toBe(
		"comfyui:moss-image-sft-style-male.alpha.v1",
	);
	expect(absence.writes).toHaveLength(0);
	const stale = await client();
	stale.evaluate(
		'selected={personId:"person-0998",source:{sourceHashes:{image:"a".repeat(64)}}};',
	);
	const query =
		"/wiki/people/person-0998?" +
		new URLSearchParams({
			schemaVersion: "2",
			inputMode: "reference-img2img",
			sourceSelection: JSON.stringify({
				kind: "selected",
				personId: "person-0998",
				sourceSHA256: "a".repeat(64),
			}),
		});
	const held = stale.hold(query);
	const old = stale.evaluate("acquireSelectedReference()");
	await held.requested;
	stale.evaluate(
		'selected={personId:"person-0041",source:{sourceAcquisition:{status:"unresolved"}}};',
	);
	held.resolve(
		Response.json({
			sourceAcquisition: { status: "acquired", eligible: true },
		}),
	);
	await old;
	expect(stale.evaluate("selected.personId")).toBe("person-0041");
	expect(stale.evaluate("selected.source.sourceAcquisition.status")).toBe(
		"unresolved",
	);
});

test("hosted MCP and saved non-GPT models keep legacy generation payloads", async () => {
	const app = await client();
	for (const mode of ["hosted", "personal"]) {
		app.evaluate(`session.mode=${JSON.stringify(mode)}; generationProvider="openai-compatible"; connectionProvider=${mode === "personal" ? '{model:"gemini-3-pro-image-preview"}' : "null"}; selected={personId:"person-1004",eligible:true,source:{}};`);
		expect(app.evaluate("usesLegacyGeneration()")).toBe(true);
		expect(app.evaluate("referenceInputReady()")).toBe(true);
		const payload = app.evaluate('legacyGenerationPayload(selected,"request-id","connection-id")');
		expect(payload).toEqual({
			requestId: "request-id", connectionId: "connection-id",
			personId: "person-1004", providerModel: "gpt-image-2.5-sunburst",
			size: "1024x1536", faceMode: { kind: "unique", variantId: null },
		});
	}
	for (const saved of ["gemini-3-pro-image-preview", "grok-imagine-image"]) {
		app.evaluate(`session.mode="personal"; connectionProvider={model:${JSON.stringify(saved)}};`);
		expect(app.evaluate("usesLegacyGeneration()")).toBe(true);
	}
	app.evaluate('session.mode="personal"; connectionProvider={model};');
	expect(app.evaluate("usesLegacyGeneration()")).toBe(false);
	app.evaluate('generationProvider="comfyui";');
	expect(app.evaluate("usesLegacyGeneration()")).toBe(false);
	app.evaluate('generationProvider="native-moss";');
	expect(app.evaluate("usesLegacyGeneration()")).toBe(false);
});

test("legacy routing rejects reference exclusion and edits without disabling default generation", async () => {
	const app = await client();
	for (const mode of ["hosted", "personal"]) {
		app.evaluate(`session.mode=${JSON.stringify(mode)}; generationProvider="openai-compatible"; connectionProvider=${mode === "personal" ? '{model:"grok-imagine-image"}' : "null"}; selected={personId:"person-1004",eligible:true,source:{}}; generationMode="reference-img2img";`);
		app.byId("reference-absence").checked = false;
		app.byId("upper-color").value = "";
		expect(app.evaluate("referenceInputReady()")).toBe(true);
		for (const intent of ["token-only", "absence", "color"]) {
			app.evaluate(`generationMode=${JSON.stringify(intent === "token-only" ? "token-only" : "reference-img2img")};`);
			app.byId("reference-absence").checked = intent === "absence";
			app.byId("upper-color").value = intent === "color" ? "dark blue" : "";
			expect(app.evaluate("referenceInputReady()")).toBe(false);
			expect(app.evaluate("legacyIntentBlockReason()")).toContain(
				intent === "color" ? "LEGACY_REFERENCE_EDIT_UNSUPPORTED" : "LEGACY_REFERENCE_EXCLUSION_UNSUPPORTED",
			);
			expect(() => app.evaluate('legacyGenerationPayload(selected,"request-id","connection-id")')).toThrow();
		}
		app.evaluate('generationMode="reference-img2img";');
		app.byId("reference-absence").checked = false;
		app.byId("upper-color").value = "";
		expect(app.evaluate("referenceInputReady()")).toBe(true);
		expect(app.evaluate("legacyIntentBlockReason()")).toBeNull();
	}
});
