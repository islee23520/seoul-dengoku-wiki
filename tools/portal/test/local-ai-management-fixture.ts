import { expect } from "bun:test";
import { spawn } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { localAiFixture } from "./local-ai-worker-fixture.ts";
export const reportSchema = z.object({
	ok: z.boolean(),
	result: z.record(z.string(), z.unknown()).optional(),
	failures: z
		.array(z.object({ code: z.string(), status: z.number().optional() }))
		.optional(),
});
const rpcSchema = z.object({ id: z.number(), result: z.unknown() });
export async function localAiClients() {
	const transcript: string[] = [];
	const record = (line: string) => {
		transcript.push(line);
		console.log(line);
	};
	const root = await mkdtemp(join(tmpdir(), "local-ai-management-"));
	let appForCleanup:
		| Awaited<ReturnType<typeof localAiFixture>>["app"]
		| undefined;
	let childForCleanup: ReturnType<typeof spawn> | undefined;
	try {
		const f = await localAiFixture(root);
		const { app, assertion } = f;
		appForCleanup = app;
		const address = await app.listen();
		const origin = `http://127.0.0.1:${address.port}`;
		const preload = join(root, "controlled.mjs");
		// Node's existing --import seam changes only this child transport, never product auth.
		await writeFile(
			preload,
			`import cp from 'node:child_process';import{request}from'node:http';import{syncBuiltinESMExports}from'node:module';import{PassThrough}from'node:stream';import{EventEmitter}from'node:events';const original=cp.spawn;cp.spawn=(command,args,options)=>{if(command!=='cloudflared')return original(command,args,options);const c=new EventEmitter();c.stdout=new PassThrough();c.stderr=new PassThrough();queueMicrotask(()=>{c.stdout.end(${JSON.stringify(assertion)});c.emit('close',0);});return c;};syncBuiltinESMExports();globalThis.fetch=async(input,init)=>{const u=new URL(String(input));if(u.origin!=='https://sss.linalab.io')throw Error('outside fixture');const headers={...Object.fromEntries(new Headers(init?.headers)),host:'sss.linalab.io','cf-access-jwt-assertion':${JSON.stringify(assertion)}};return new Promise((done,reject)=>{const req=request(${JSON.stringify(origin)}+u.pathname+u.search,{method:init?.method,headers,signal:init?.signal},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('error',reject);res.on('end',()=>{done(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers}));});});req.on('error',reject);req.end(init?.body);});};`,
		);
		const state = join(root, "state");
		await mkdir(state, { mode: 0o700 });
		const pathKey = "PATH",
			nodeKey = "NODE_BINARY";
		const env = {
			PATH: process.env[pathKey],
			SSSTOOL_SERVER_URL: "https://sss.linalab.io/tools/",
			SSSTOOL_STATE_DIRECTORY: state,
		};
		const node = process.env[nodeKey] ?? "node";
		const launch = (file: string, args: readonly string[]) =>
			spawn(
				node,
				[
					"--import",
					pathToFileURL(preload).href,
					join(import.meta.dir, "../dist", `${file}.mjs`),
					...args,
				],
				{ env, stdio: ["pipe", "pipe", "pipe"] },
			);
		async function cli(args: readonly string[]) {
			const child = launch("cli", args),
				exited = once(child, "exit", { signal: AbortSignal.timeout(15000) });
			let stdout = "",
				stderr = "";
			child.stdout.on("data", (chunk) => {
				stdout += String(chunk);
			});
			child.stderr.on("data", (chunk) => {
				stderr += String(chunk);
			});
			const [code] = await exited;
			record(
				JSON.stringify({
					command: [
						node,
						"--import",
						"<private fixture preload>",
						"dist/cli.mjs",
						...args,
					],
					stdout,
					stderr,
					exit: code,
				}),
			);
			expect(stderr).not.toContain(assertion);
			const report = reportSchema.parse(JSON.parse(stdout));
			expect(code).toBe(report.ok ? 0 : 1);
			expect(stdout).not.toContain(assertion);
			return report;
		}
		const child = launch("mcp", []),
			exited = once(child, "exit", { signal: AbortSignal.timeout(60000) });
		childForCleanup = child;
		const events = new EventEmitter();
		let serial = 0,
			stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		createInterface({ input: child.stdout }).on("line", (line) => {
			record(`MCP stdout ${line}`);
			expect(line).not.toContain(assertion);
			const reply = rpcSchema.parse(JSON.parse(line));
			events.emit(String(reply.id), reply.result);
		});
		async function rpc(method: string, params: unknown = {}) {
			const id = ++serial,
				answer = once(events, String(id), {
					signal: AbortSignal.timeout(15000),
				});
			const line = JSON.stringify({ jsonrpc: "2.0", id, method, params });
			record(`MCP stdin ${line}`);
			child.stdin.write(`${line}\n`);
			return (await answer)[0];
		}
		async function call(name: string, fields: object = {}) {
			return reportSchema.parse(
				z
					.object({ structuredContent: z.unknown() })
					.parse(await rpc("tools/call", { name, arguments: fields }))
					.structuredContent,
			);
		}
		return {
			...f,
			root,
			state,
			node,
			child,
			exited,
			cli,
			rpc,
			call,
			stderr: () => stderr,
			record,
			transcript,
		};
	} catch (error) {
		try {
			if (childForCleanup && childForCleanup.exitCode === null) {
				const closed = once(childForCleanup, "close", {
					signal: AbortSignal.timeout(15000),
				});
				childForCleanup.kill();
				await closed;
			}
		} finally {
			try {
				await appForCleanup?.close();
			} finally {
				await rm(root, { recursive: true, force: true });
			}
		}
		throw error;
	}
}
