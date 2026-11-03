import { useEffect } from "react";
import { ExternalLink, Maximize2, X } from "lucide-react";
import { EXHIBIT_CREDIT, KIND_LABEL, type Exhibit, type ExhibitImage } from "@/data/historyExhibits";

const BASE = import.meta.env.BASE_URL;

function Thumb({ img, className }: { img: ExhibitImage; className: string }) {
  const portrait = img.kind === "portrait";
  return (
    <div className={`relative shrink-0 overflow-hidden bg-[hsl(214_30%_10%)] ${className}`}>
      <img src={`${BASE}${img.src}`} alt={`${img.name.ko} ${portrait ? "초상" : "깃발"} — ${KIND_LABEL[img.kind].ko}`} draggable={false}
        className={`h-full w-full ${portrait ? "object-cover object-top" : "object-contain p-1"}`} />
    </div>
  );
}

/** Flow-positioned reference card: sits in the info strip between portraits and dialogue, never overlaid. */
export function ExhibitPanel({ exhibit, subs, onOpen, onHide }: { exhibit: Exhibit; subs: boolean; onOpen: () => void; onHide: () => void }) {
  const lead = exhibit.images[0];
  return (
    <aside key={exhibit.id} aria-label={`관련 자료: ${exhibit.heading.ko}`} data-layout="exhibit"
      className="fade wrap-text w-full border border-[hsl(var(--parchment)/0.22)] bg-[hsl(214_38%_6%/0.86)] backdrop-blur-md lg:w-[440px] lg:shrink-0">
      <div className="flex gap-3 p-2.5 md:p-3">
        <button type="button" onClick={onOpen} aria-label="자료 크게 보기 / Enlarge" className="group relative flex shrink-0 gap-1">
          {exhibit.images.slice(0, 2).map((img) => (
            <Thumb key={img.src} img={img} className={img.kind === "portrait" ? "h-[84px] w-[64px] md:h-[112px] md:w-[84px]" : "h-[42px] w-[58px] self-end md:h-[54px] md:w-[76px]"} />
          ))}
          <Maximize2 className="absolute right-1 top-1 h-3 w-3 text-[hsl(var(--parchment))] opacity-70 group-hover:opacity-100" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[hsl(var(--ember))]">{exhibit.date} · 참고 자료</p>
            <button type="button" onClick={onHide} aria-label="자료 숨기기 / Hide reference" className="-mr-1 -mt-1 ml-auto p-1 text-[hsl(var(--frost)/0.7)] hover:text-[hsl(var(--parchment))]"><X className="h-3.5 w-3.5" /></button>
          </div>
          <p className="mt-0.5 font-display text-sm font-bold leading-snug text-[hsl(var(--parchment))] md:text-base">{exhibit.heading.ko}</p>
          {subs && <p className="font-en text-xs italic leading-snug text-[hsl(var(--frost)/0.8)]">{exhibit.heading.en}</p>}
          <p className="mt-1 font-ui text-[11px] leading-snug text-[hsl(var(--parchment)/0.85)]">{lead.name.ko} · {lead.role.ko}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="inline-block border border-[hsl(var(--ember)/0.5)] px-1.5 py-px font-ui text-[10px] text-[hsl(var(--ember))]">
            {KIND_LABEL[lead.kind].ko}{subs && <span className="opacity-70"> · {KIND_LABEL[lead.kind].en}</span>}
          </p>
          <button type="button" onClick={onOpen} className="font-ui text-[10px] text-[hsl(var(--frost))] underline underline-offset-2">근거·출처{subs && " / Sources"}</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function ExhibitDetail({ exhibit, subs, onClose }: { exhibit: Exhibit; subs: boolean; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={exhibit.heading.ko} onClick={onClose} data-layout="exhibit-detail"
      className="fade fixed inset-0 z-[75] flex items-end justify-center bg-[hsl(214_40%_3%/0.72)] backdrop-blur-sm md:items-center">
      <div onClick={(e) => e.stopPropagation()} className="wrap-text max-h-[92dvh] w-full max-w-3xl overflow-y-auto overscroll-contain border-t border-[hsl(var(--parchment)/0.25)] bg-[hsl(214_32%_7%)] md:border">
        <div className="sticky top-0 z-10 flex items-start gap-3 bg-[hsl(214_32%_7%)] px-5 pb-3 pt-4 md:px-7">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--ember))]">{exhibit.date} · 참고 자료 / Reference</p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-[hsl(var(--parchment))] md:text-2xl">{exhibit.heading.ko}</h2>
            {subs && <p className="font-en italic text-[hsl(var(--frost)/0.85)]">{exhibit.heading.en}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="닫기 / Close" className="ml-auto shrink-0 p-2 text-[hsl(var(--frost))]"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 px-5 pb-2 sm:grid-cols-2 md:px-7">
          {exhibit.images.map((img) => (
            <figure key={img.src} className="border border-[hsl(var(--parchment)/0.14)]">
              <div className={`${img.kind === "portrait" ? "aspect-[4/5]" : "aspect-[3/2]"} relative bg-[hsl(214_30%_10%)]`}>
                <img src={`${BASE}${img.src}`} alt={`${img.name.ko} — ${KIND_LABEL[img.kind].ko}`} className={`absolute inset-0 h-full w-full ${img.kind === "portrait" ? "object-cover object-top" : "object-contain p-4"}`} />
                <span className="absolute left-2 top-2 bg-[hsl(214_40%_4%/0.85)] px-1.5 py-0.5 font-ui text-[10px] text-[hsl(var(--ember))]">{KIND_LABEL[img.kind].ko}</span>
              </div>
              <figcaption className="p-3">
                <p className="font-display text-base font-bold text-[hsl(var(--parchment))]">{img.name.ko}{subs && <span className="font-en ml-2 text-sm font-normal italic text-[hsl(var(--frost)/0.8)]">{img.name.en}</span>}</p>
                <p className="font-mono text-[10px] text-[hsl(var(--frost)/0.6)]">{img.ref}</p>
                <p className="mt-1 font-ui text-xs text-[hsl(var(--parchment)/0.9)]">{img.role.ko}</p>
                {subs && <p className="font-en text-xs italic text-[hsl(var(--frost)/0.75)]">{img.role.en}</p>}
                {subs && <p className="mt-1 font-en text-[10px] text-[hsl(var(--ember)/0.8)]">{KIND_LABEL[img.kind].en}</p>}
                <a href={img.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-ui text-[11px] text-[hsl(var(--frost))] underline underline-offset-2">위키 원문{subs && " · Wiki page"} <ExternalLink className="h-3 w-3" /></a>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="px-5 pb-6 pt-3 md:px-7">
          <p className="font-ui text-sm leading-relaxed text-[hsl(var(--parchment))]">{exhibit.note.ko}</p>
          {subs && <p className="mt-1 font-en text-sm italic leading-relaxed text-[hsl(var(--frost)/0.85)]">{exhibit.note.en}</p>}
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--ember))]">근거 · Sources</p>
          <ul className="mt-1 space-y-1">
            {exhibit.sources.map((s) => (
              <li key={s.label.ko}>
                <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-ui text-xs text-[hsl(var(--parchment))] underline underline-offset-2">
                  {s.label.ko}{subs && <span className="opacity-70"> · {s.label.en}</span>} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[hsl(var(--parchment)/0.12)] pt-3 font-ui text-[10px] leading-relaxed text-[hsl(var(--frost)/0.65)]">{EXHIBIT_CREDIT.ko}{subs && <><br />{EXHIBIT_CREDIT.en}</>}</p>
        </div>
      </div>
    </div>
  );
}
