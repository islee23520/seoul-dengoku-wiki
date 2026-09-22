export async function renderMermaid(source) {
  const text = String(source ?? "");
  if (!text.trim() || !/^[a-z]+\s/.test(text.trim())) {
    return { error: "mermaid-error" };
  }
  try {
    const mod = await import("mermaid");
    const mermaid = mod.default ?? mod;
    const id = "m" + Math.random().toString(36).slice(2);
    const out = await mermaid.render(id, text);
    return { svg: out.svg };
  } catch {
    return { error: "mermaid-error" };
  }
}
