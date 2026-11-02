import { createServer } from "node:http";
const UPSTREAM = "https://seoul-dengoku.linalab.io";
const PORT = 18791;
const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" || !/^\/wiki\/[A-Za-z0-9._/-]*$/.test(req.url ?? "") || req.url.includes("..")) {
      res.writeHead(403).end();
      return;
    }
    const response = await fetch(UPSTREAM + req.url, {
      signal: AbortSignal.timeout(10000),
      headers: { accept: req.headers.accept ?? "*/*" },
    });
    if (response.status === 404) {
      res.writeHead(404).end();
      return;
    }
    const finalUrl = new URL(response.url);
    if (!response.ok || !response.body || finalUrl.pathname.startsWith("/wiki/") === false) {
      res.writeHead(502).end();
      return;
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 2097152) {
        res.writeHead(502).end();
        return;
      }
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    res.writeHead(200, {
      "content-type": response.headers.get("content-type") ?? "application/octet-stream",
      "content-length": bytes.length,
      "cache-control": "no-store",
    }).end(bytes);
  } catch {
    res.writeHead(502).end();
  }
});
server.listen(PORT, "127.0.0.1", () => console.log("WIKI_RELAY_READY " + PORT));
