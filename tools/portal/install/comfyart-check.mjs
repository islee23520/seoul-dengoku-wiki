import { readFile, stat } from "node:fs/promises";

const install = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0";
const timeoutMs = 5000;
const packs = [
  ["ComfyUI-GGUF", "UnetLoaderGGUF"],
  ["ComfyUI-HunyuanImage3", "HunyuanImage3ModelLoader"],
  ["ComfyUI-MiniMax-H3-Image-Studio", "H3ImageSamplingPreset"],
];

function endpointFrom(args) {
  if (args.length !== 0 && (args.length !== 2 || args[0] !== "--endpoint"))
    throw Error("Usage: node tools/portal/install/comfyart-check.mjs [--endpoint http://host:port]");
  const url = new URL(args.length ? args[1] : "http://100.77.98.25:8188");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/")
    throw Error("Endpoint must be an HTTP(S) origin without credentials, path, query or fragment");
  return url.origin;
}

const nonemptyObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.keys(value).length > 0;

async function request(endpoint, path, json = true) {
  const response = await fetch(`${endpoint}${path}`, {
    signal: AbortSignal.timeout(timeoutMs), redirect: "error", cache: "no-store",
  });
  if (response.status !== 200) {
    await response.body?.cancel();
    throw Error(`${path}: HTTP ${response.status}${path === "/comfyart/" && response.status === 404 ? " not installed" : ""}`);
  }
  if (json) return response.json();
  await response.body?.cancel();
}

async function main() {
  const endpoint = endpointFrom(process.argv.slice(2));
  if (Number(process.versions.node.split(".")[0]) < 24) throw Error("Node >=24 required");
  const checks = [
    ["version", async () => {
      const body = await request(endpoint, "/system_stats");
      if (body.system?.comfyui_version !== "0.42.0")
        throw Error(`Expected 0.42.0, got ${JSON.stringify(body.system?.comfyui_version)}`);
      return "ComfyUI 0.42.0";
    }],
    ["canvas", async () => {
      await request(endpoint, "/comfyart/", false);
      return "/comfyart/ HTTP 200";
    }],
    ["precise-loader", async () => {
      const body = await request(endpoint, "/object_info/ComfyArtPreciseUNETLoader");
      if (!nonemptyObject(body.ComfyArtPreciseUNETLoader?.input))
        throw Error("ComfyArtPreciseUNETLoader not registered with nonempty input");
      return "ComfyArtPreciseUNETLoader.input";
    }],
    ["existing-nodes", async () => {
      for (const [pack, node] of packs) {
        const directory = `${install}/custom_nodes/${pack}`;
        if (!(await stat(directory)).isDirectory()) throw Error(`${pack}: not a directory`);
        const source = await readFile(`${directory}/nodes.py`, "utf8");
        const entry = await readFile(`${directory}/__init__.py`, "utf8");
        // Hunyuan uses the current ComfyExtension API instead of a legacy mapping.
        const declared = pack === "ComfyUI-HunyuanImage3"
          ? entry.includes("comfy_entrypoint") && source.includes(`node_id="${node}"`) &&
            /return\s+\[HunyuanImage3ModelLoader\b/.test(source)
          : entry.includes("NODE_CLASS_MAPPINGS") &&
            new RegExp(`NODE_CLASS_MAPPINGS\\s*=\\s*\\{[^}]*["']${node}["']\\s*:`, "s").test(source);
        if (!declared) throw Error(`${pack}: ${node} absent from registration source`);
        const body = await request(endpoint, `/object_info/${node}`);
        if (!nonemptyObject(body[node]?.input)) throw Error(`${pack}: ${node} not registered with input`);
      }
      return packs.map(([pack, node]) => `${pack} (${node})`).join(", ");
    }],
    ["model", async () => {
      const body = await request(endpoint, "/object_info/UNETLoader");
      const names = body.UNETLoader?.input?.required?.unet_name?.[0];
      if (!Array.isArray(names) || !names.includes("z_image_turbo_bf16.safetensors"))
        throw Error("UNETLoader missing z_image_turbo_bf16.safetensors; follow the model setup instructions in tools/portal/install/COMFYART.md");
      return "z_image_turbo_bf16.safetensors";
    }],
  ];
  for (const [name, check] of checks) {
    try {
      console.log(`PASS ${name}: ${await check()}`);
    } catch (error) {
      console.error(`FAIL ${name}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

await main().catch((error) => {
  console.error(`FAIL arguments: ${error.message}`);
  process.exitCode = 1;
});
