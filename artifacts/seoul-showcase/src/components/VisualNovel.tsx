import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ExternalLink, FastForward, History, Play, Pause, RotateCcw, RotateCw, Subtitles, Volume2, VolumeX, X } from "lucide-react";
import {
  CHOICE, CODA, ENDINGS, PORTRAIT_CREDIT, SCENES, SPEAKERS, WIKI_URL,
  type BgId, type ChoiceId, type SpeakerId, type StoryLine,
} from "@/data/storyScript";
import { BUNDLED_CLIPS, clipUrl } from "@/data/narration";
import { sound } from "@/utils/sound";
import { EXHIBIT_BY_LINE } from "@/data/historyExhibits";
import { ExhibitPanel, ExhibitDetail } from "@/components/HistoryExhibit";
import { speak, stopSpeech, useVoices, type VoiceMode } from "@/utils/speech";

const BASE = import.meta.env.BASE_URL;
const BG: Record<BgId, { src: string; kb: string }> = {
  surface: { src: "scenes/surface.jpg", kb: "kb-a" },
  namsan: { src: "scenes/namsan.jpg", kb: "kb-b" },
  tunnel: { src: "scenes/tunnel.jpg", kb: "kb-d" },
  archive: { src: "scenes/archive.jpg", kb: "kb-c" },
  railyard: { src: "scenes/railyard.jpg", kb: "kb-a" },
  platform: { src: "scenes/platform.jpg", kb: "kb-b" },
  suseo: { src: "scenes/suseo.jpg", kb: "kb-c" },
  granary: { src: "scenes/granary.jpg", kb: "kb-d" },
};

interface Frame { key: string; act: string; actEn: string; title: string; titleEn: string; place: string; placeEn: string; year: string; bg: BgId }
type Step = { kind: "line"; line: StoryLine; frame: Frame } | { kind: "choice"; line: StoryLine; frame: Frame };

const BASE_STEPS: Step[] = SCENES.flatMap((s) => {
  const frame: Frame = { key: s.id, act: s.act.ko, actEn: s.act.en, title: s.title.ko, titleEn: s.title.en, place: s.place.ko, placeEn: s.place.en, year: s.year, bg: s.bg };
  return s.lines.map((line) => ({ kind: "line" as const, line, frame }));
});
const CHOICE_FRAME: Frame = { key: "crossroad", act: "결단", actEn: "The Choice", title: CHOICE.title.ko, titleEn: CHOICE.title.en, place: CHOICE.place.ko, placeEn: CHOICE.place.en, year: CHOICE.year, bg: CHOICE.bg };
const CHOICE_INDEX = BASE_STEPS.length;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function VisualNovel() {
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(0);
  const [choice, setChoice] = useState<ChoiceId | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [auto, setAuto] = useState(false);
  const [muted, setMuted] = useState(false);
  const [subs, setSubs] = useState(true);
  const [log, setLog] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [voiceDone, setVoiceDone] = useState(true);
  const [replay, setReplay] = useState(0);
  const [showEx, setShowEx] = useState(true);
  const [exOpen, setExOpen] = useState(false);
  const voices = useVoices();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [...BASE_STEPS, { kind: "choice", line: CHOICE.prompt, frame: CHOICE_FRAME }];
    if (choice) {
      const e = ENDINGS[choice];
      const ef: Frame = { key: `end-${choice}`, act: "결말", actEn: "Ending", title: e.title.ko, titleEn: e.title.en, place: CHOICE.place.ko, placeEn: CHOICE.place.en, year: "2126", bg: e.bg };
      e.lines.forEach((line) => s.push({ kind: "line", line, frame: ef }));
      const cf: Frame = { key: "coda", act: "종장", actEn: "Coda", title: "4 + 8 + 3", titleEn: "Sixteen into three", place: "남산", placeEn: "Namsan", year: "2116 → 2126", bg: "namsan" };
      CODA.forEach((line) => s.push({ kind: "line", line, frame: cf }));
    }
    return s;
  }, [choice]);

  const last = steps.length - 1;
  const step = steps[Math.min(pos, last)];
  const line = step.line;
  const isDone = revealed >= line.ko.length;
  const atEnd = !!choice && pos >= last;

  const firstSeen = useMemo(() => {
    const m = new Map<SpeakerId, number>();
    steps.forEach((s, i) => { if (s.line.speaker !== "narrator" && !m.has(s.line.speaker)) m.set(s.line.speaker, i); });
    return m;
  }, [steps]);
  const introFor = line.speaker !== "narrator" && firstSeen.get(line.speaker) === pos ? line.speaker : null;

  // Typewriter
  useEffect(() => {
    if (!started) return;
    if (reduced()) { setRevealed(line.ko.length); return; }
    setRevealed(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1; setRevealed(i);
      if (i % 2 === 0 && line.ko[i - 1]?.trim()) sound.click();
      if (i >= line.ko.length) window.clearInterval(id);
    }, 34);
    return () => window.clearInterval(id);
  }, [started, line]);

  // Voice
  const voiceSource: "bundled" | "synth" | "none" =
    voiceMode === "off" ? "none" : clipUrl(line.id, voiceMode) ? "bundled" : voices[voiceMode] ? "synth" : "none";
  const stopVoice = useCallback(() => {
    stopSpeech();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    sound.duck(false);
  }, []);
  useEffect(() => {
    stopVoice();
    if (!started || muted || voiceSource === "none") { setVoiceDone(true); return; }
    setVoiceDone(false);
    let alive = true;
    const finish = () => { if (!alive) return; sound.duck(false); setVoiceDone(true); };
    sound.duck(true);
    if (voiceSource === "bundled") {
      const a = new Audio(clipUrl(line.id, voiceMode as "ko" | "en")!);
      audioRef.current = a; a.onended = finish; a.onerror = finish; a.play().catch(finish);
    } else {
      const v = voices[voiceMode as "ko" | "en"];
      if (v) speak(voiceMode === "en" ? line.en : line.ko, v, finish); else finish();
    }
    return () => { alive = false; stopVoice(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, muted, voiceMode, voiceSource, line.id, replay]);
  useEffect(() => () => { stopVoice(); sound.dispose(); }, [stopVoice]);
  useEffect(() => { sound.setMuted(muted); }, [muted]);

  const next = useCallback(() => {
    if (!isDone) { setRevealed(line.ko.length); return; }
    if (step.kind === "choice") return;
    if (pos < last) { if (steps[pos + 1].frame.key !== step.frame.key) sound.chime(); setPos(pos + 1); }
  }, [isDone, line, step, pos, last, steps]);
  const back = useCallback(() => setPos((p) => Math.max(0, p - 1)), []);
  const skip = useCallback(() => {
    if (pos < CHOICE_INDEX) { setPos(CHOICE_INDEX); sound.chime(); } else if (choice) setPos(last);
  }, [pos, choice, last]);
  const choose = (c: ChoiceId) => { setChoice(c); setPos(CHOICE_INDEX + 1); sound.chime(); };
  const restart = () => { setChoice(null); setAuto(false); setPos(0); };
  useEffect(() => { if (pos > last) setPos(last); }, [pos, last]);

  // Auto
  useEffect(() => {
    if (!auto || !started || log || exOpen || step.kind !== "line" || !isDone || !voiceDone || pos >= last) return;
    const wait = voiceSource !== "none" ? 900 : Math.max(2600, line.ko.length * 75 + (subs ? line.en.length * 30 : 0));
    const id = window.setTimeout(() => setPos((p) => p + 1), wait);
    return () => window.clearTimeout(id);
  }, [auto, started, log, exOpen, step, isDone, voiceDone, pos, last, subs, voiceSource, line]);

  const keys = useRef({ next, back });
  keys.current = { next, back };
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (log || exOpen || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("button, a, input, select, [role='dialog']")) return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); keys.current.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); keys.current.back(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, log, exOpen]);

  const begin = () => { sound.start(); sound.setMuted(muted); setStarted(true); };
  const voiceOk = (m: "ko" | "en") => BUNDLED_CLIPS[m].size > 0 || !!voices[m];
  const voiceLabel = voiceMode === "off" ? null : muted ? "음소거 · Muted" : voiceSource === "bundled" ? "AI 생성 내레이션 · AI narration" : voiceSource === "synth" ? "브라우저 합성 음성 · Browser speech, not a recording" : "음성 없음 · Voice unavailable";

  const cast: SpeakerId[] = step.kind === "choice" ? [] : line.cast ?? [];
  const frame = step.frame;
  const exhibit = step.kind === "line" ? EXHIBIT_BY_LINE[line.id] ?? null : null;

  const showChoice = step.kind === "choice" && isDone;
  const showFinale = atEnd && isDone;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[hsl(214_40%_4%)] select-none">
      {/* Atmosphere is fixed behind the scrolling layout so text zones can flow freely. */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <Backdrop bg={started ? frame.bg : "surface"} />
        <Snow />
        <div className="vignette absolute inset-0 z-[5]" />
        <div className="absolute inset-x-0 top-0 z-[6] h-[6vh] bg-gradient-to-b from-[hsl(214_40%_3%)] to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <TopBar started={started} subs={subs} setSubs={setSubs} muted={muted} setMuted={setMuted} voiceMode={voiceMode}
          setVoiceMode={(m) => { setVoiceMode(m); if (!started && m !== "off") begin(); }} koOk={voiceOk("ko")} enOk={voiceOk("en")} openLog={() => setLog(true)} />

        {!started ? <Title onBegin={begin} subs={subs} /> : (
          <>
            <section data-layout="scene-header" aria-label="장면 / Scene"
              className="wrap-text grid shrink-0 gap-3 px-5 pb-2 pt-2 md:grid-cols-[minmax(0,1fr)_minmax(0,auto)] md:gap-8 md:px-12 md:pt-4">
              <div key={frame.key} className="text-plate min-w-0 max-w-3xl py-1 pr-6">
                <p className="rise font-mono text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--ember))] md:tracking-[0.4em]">{frame.year} · {frame.act}{subs && <span className="opacity-60"> / {frame.actEn}</span>}</p>
                <h1 className="rise mt-1.5 font-display text-2xl font-extrabold leading-tight text-[hsl(var(--parchment))] drop-shadow-[0_2px_18px_hsl(214_40%_3%)] sm:text-3xl lg:text-5xl" style={{ animationDelay: "150ms" }}>{frame.title}</h1>
                {subs && <p className="rise font-en mt-0.5 text-base italic leading-snug text-[hsl(var(--frost))] md:text-xl" style={{ animationDelay: "250ms" }}>{frame.titleEn}</p>}
                <div className="rule mt-2 h-px w-32 bg-[hsl(var(--parchment)/0.5)]" style={{ animationDelay: "350ms" }} />
                <p className="rise mt-1.5 font-ui text-xs text-[hsl(var(--frost)/0.85)]" style={{ animationDelay: "400ms" }}>{frame.place}{subs && ` · ${frame.placeEn}`}</p>
              </div>
              {line.caption && (
                <div key={`cap-${line.id}`} data-layout="scene-metadata" aria-label="사건 / Event"
                  className="fade text-plate min-w-0 max-w-md border-l border-[hsl(var(--ember)/0.6)] py-1 pl-3 md:text-plate-r md:self-start md:border-l-0 md:border-r md:pl-6 md:pr-3 md:text-right">
                  <p className="font-display text-lg font-bold leading-snug text-[hsl(var(--parchment))] md:text-2xl">{line.caption.ko}</p>
                  {subs && <p className="font-en text-sm italic leading-snug text-[hsl(var(--frost)/0.85)] md:text-base">{line.caption.en}</p>}
                </div>
              )}
            </section>

            {showChoice ? <ChoiceRow onChoose={choose} subs={subs} />
              : showFinale ? <Finale subs={subs} onRestart={restart} onReselect={() => { setChoice(null); setPos(CHOICE_INDEX); }} />
              : <Stage cast={cast} speaker={line.speaker} speaking={!isDone || !voiceDone} />}

            {!showChoice && !showFinale && (introFor || exhibit) && (
              <div data-layout="info-strip" className="flex shrink-0 flex-col gap-2 px-3 pb-2 md:px-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 justify-center lg:justify-start">
                  {exhibit && showEx && <ExhibitPanel exhibit={exhibit} subs={subs} onOpen={() => setExOpen(true)} onHide={() => setShowEx(false)} />}
                  {exhibit && !showEx && (
                    <button type="button" onClick={() => setShowEx(true)} data-layout="exhibit-toggle" className="fade border border-[hsl(var(--parchment)/0.35)] bg-[hsl(214_40%_4%/0.75)] px-3 py-1.5 font-ui text-[11px] text-[hsl(var(--parchment))] backdrop-blur">
                      관련 자료 보기{subs && <span className="opacity-60"> · Show reference</span>}
                    </button>
                  )}
                </div>
                {introFor && <Intro id={introFor} key={`intro-${pos}`} subs={subs} />}
              </div>
            )}

            <Dialogue line={line} revealed={revealed} subs={subs} isDone={isDone} onNext={next} onBack={back} canBack={pos > 0}
              auto={auto} toggleAuto={() => setAuto((v) => !v)} onSkip={skip} voiceLabel={voiceLabel}
              onReplay={() => setReplay((n) => n + 1)} replayOff={voiceSource === "none" || muted} isChoice={step.kind === "choice"}
              progress={(pos + 1) / (choice ? steps.length : steps.length + 4)} />
          </>
        )}
      </div>

      {exOpen && exhibit && <ExhibitDetail exhibit={exhibit} subs={subs} onClose={() => setExOpen(false)} />}
      {log && <Backlog steps={steps.slice(0, pos + 1)} subs={subs} onClose={() => setLog(false)} onJump={(i) => { setPos(i); setLog(false); }} />}
    </div>
  );
}

function Backdrop({ bg }: { bg: BgId }) {
  // True crossfade: the previous plate stays underneath while the new one fades in, then is dropped.
  const [layers, setLayers] = useState<{ bg: BgId; n: number }[]>([{ bg, n: 0 }]);
  useEffect(() => {
    setLayers((ls) => (ls[ls.length - 1].bg === bg ? ls : [...ls.slice(-1), { bg, n: ls[ls.length - 1].n + 1 }]));
    const id = window.setTimeout(() => setLayers((ls) => ls.slice(-1)), 1800);
    return () => window.clearTimeout(id);
  }, [bg]);
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {layers.map((l, i) => (
        <div key={l.n} className={`absolute inset-0 ${i > 0 ? "bg-in" : ""}`}>
          <div className={`kb ${BG[l.bg].kb}`} style={{ backgroundImage: `url(${BASE}${BG[l.bg].src})` }} />
        </div>
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(214_40%_4%/0.35),transparent_30%,transparent_50%,hsl(214_40%_4%/0.85))]" />
    </div>
  );
}

function Snow() {
  const flakes = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const r = (n: number) => { const x = Math.sin(i * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
    const size = 1.5 + r(1) * 3.5;
    return { left: r(2) * 100, size, dur: 9 + r(3) * 14, delay: -r(4) * 20, dx: `${(r(5) - 0.5) * 18}vw`, op: 0.25 + r(6) * 0.55, blur: size > 4 ? 1.5 : 0 };
  }), []);
  return (
    <div className="pointer-events-none absolute inset-0 z-[7] overflow-hidden" aria-hidden>
      {flakes.map((f, i) => (
        <span key={i} className="flake" style={{ left: `${f.left}%`, width: f.size, height: f.size, opacity: f.op, filter: f.blur ? `blur(${f.blur}px)` : undefined, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, ["--dx" as string]: f.dx }} />
      ))}
    </div>
  );
}

type Slot = { id: SpeakerId; side: "left" | "right" | "center"; leaving: boolean };

function Stage({ cast, speaker, speaking }: { cast: SpeakerId[]; speaker: SpeakerId; speaking: boolean }) {
  // Iyen on the left as guide; the person she introduces on the right. Departing figures play an exit before unmounting.
  const target = useMemo<Slot[]>(() => {
    const right = cast.find((c) => c !== "iyen") ?? null;
    const out: Slot[] = [];
    if (cast.includes("iyen")) out.push({ id: "iyen", side: right ? "left" : "center", leaving: false });
    if (right) out.push({ id: right, side: "right", leaving: false });
    return out;
  }, [cast.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const [slots, setSlots] = useState<Slot[]>(target);
  useEffect(() => {
    const k = (s: Slot) => `${s.id}-${s.side}`;
    setSlots((prev) => [...target, ...prev.filter((p) => !target.some((t) => k(t) === k(p))).map((p) => ({ ...p, leaving: true }))]);
    const id = window.setTimeout(() => setSlots((prev) => prev.filter((p) => !p.leaving)), 650);
    return () => window.clearTimeout(id);
  }, [target]);
  return (
    <section data-layout="portrait-stage" aria-label="인물 / Cast" className="pointer-events-none relative min-h-[260px] flex-1 overflow-hidden sm:min-h-[300px] md:min-h-[340px]">
      <div className="absolute inset-0">
        {slots.map((s) => <Figure key={`${s.id}-${s.side}`} id={s.id} side={s.side} leaving={s.leaving} lit={!s.leaving && speaker === s.id} speaking={speaking && speaker === s.id} />)}
      </div>
    </section>
  );
}

function Figure({ id, side, lit, speaking, leaving }: { id: SpeakerId; side: "left" | "right" | "center"; lit: boolean; speaking: boolean; leaving: boolean }) {
  const s = SPEAKERS[id];
  const place = side === "left" ? "left-[-14%] md:left-[2%]" : side === "right" ? "right-[-14%] md:right-[2%]" : "left-1/2 -translate-x-1/2 md:left-[8%] md:translate-x-0";
  const anim = leaving ? (side === "right" ? "exit-r" : "exit-l") : side === "right" ? "enter-r" : "enter-l";
  return (
    <div className={`absolute bottom-0 h-full w-[78vw] max-w-[620px] md:w-[44vw] ${place} ${anim}`}>
      <div className="h-full w-full transition-[opacity,transform] duration-700" style={{ opacity: lit ? 1 : 0.42, transform: lit ? "scale(1)" : "scale(0.96) translateY(2%)" }}>
        <div className="breathe relative h-full w-full">
          {/* Mirror wrapper is separate from motion transforms: right-side figures face left, toward the conversation. */}
          <div className="absolute inset-0" style={{ transform: side === "right" ? "scaleX(-1)" : undefined }}>
            <img src={`${BASE}${s.portrait}`} alt={`${s.name.ko} (${s.characterId}) 초상`} className="portrait-mask absolute bottom-0 left-0 h-full w-full object-contain object-bottom transition-[filter] duration-700"
              style={{ filter: lit ? "saturate(1.02) brightness(1)" : "saturate(0.5) brightness(0.55) blur(1px)" }} draggable={false} />
          </div>
          <div className="absolute inset-x-[15%] bottom-0 h-1/3 bg-gradient-to-t from-[hsl(214_40%_4%)] to-transparent" />
          <div className="absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500" style={{ opacity: speaking ? 0.3 : 0, background: `radial-gradient(ellipse at 50% 40%, ${s.tint}, transparent 60%)` }} />
        </div>
      </div>
    </div>
  );
}

function Intro({ id, subs }: { id: SpeakerId; subs: boolean }) {
  const s = SPEAKERS[id];
  return (
    <div data-layout="intro" aria-label={`인물 소개: ${s.name.ko}`} className="intro wrap-text text-plate-r ml-auto min-w-0 max-w-full border-r-2 py-1.5 pl-6 pr-3 text-right sm:max-w-md" style={{ borderColor: s.tint }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: s.tint }}>{s.characterId} · {s.state}</p>
      <p className="font-display text-2xl font-extrabold leading-tight text-[hsl(var(--parchment))] md:text-3xl">{s.name.ko}{subs && <span className="font-en ml-2 text-base font-normal italic text-[hsl(var(--frost))] md:text-lg">{s.name.en}</span>}</p>
      <p className="mt-2 font-ui text-sm text-[hsl(var(--parchment)/0.9)]">{s.title?.ko}</p>
      <p className="font-ui text-xs text-[hsl(var(--frost)/0.75)]">{[s.clan, s.rank].filter(Boolean).join(" · ")}</p>
    </div>
  );
}

function Dialogue(p: {
  line: StoryLine; revealed: number; subs: boolean; isDone: boolean; onNext: () => void; onBack: () => void; canBack: boolean;
  auto: boolean; toggleAuto: () => void; onSkip: () => void; voiceLabel: string | null; onReplay: () => void; replayOff: boolean; isChoice: boolean; progress: number;
}) {
  const s = SPEAKERS[p.line.speaker];
  const narr = p.line.speaker === "narrator";
  return (
    <section data-layout="dialogue" aria-label="대사 / Dialogue" className="wrap-text relative z-20 shrink-0">
      <div className="parchment mx-auto w-full max-w-5xl px-5 pb-4 pt-4 md:px-10 md:pb-6 md:pt-5" onClick={p.isChoice ? undefined : p.onNext} role="button" tabIndex={-1} aria-label="다음 / Next">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-display text-xl font-extrabold md:text-2xl" style={{ color: s.tint }}>{s.name.ko}</span>
          {p.subs && <span className="font-en text-base italic text-[hsl(var(--frost)/0.8)]">{s.name.en}</span>}
          {!narr && s.title && <span className="hidden font-ui text-[11px] text-[hsl(var(--frost)/0.6)] md:inline">{s.title.ko}</span>}
          {p.line.source && <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-[hsl(var(--frost)/0.45)]">{p.line.source === "profile" ? "공개 인물 기록 기반" : p.line.source === "annals" ? "세기 연대기" : "십육국"}</span>}
        </div>
        <p lang="ko" className={`mt-2 min-h-[3.4em] text-lg leading-relaxed text-[hsl(var(--parchment))] md:text-[1.4rem] ${narr ? "" : ""} ${p.isDone && !p.isChoice ? "caret" : ""}`}>
          {p.line.ko.slice(0, p.revealed)}<span className="opacity-0">{p.line.ko.slice(p.revealed)}</span>
        </p>
        {p.subs && <p lang="en" className="font-en mt-1 text-base italic leading-snug text-[hsl(var(--frost)/0.85)] md:text-lg">{p.line.en}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-1 font-ui text-[11px] text-[hsl(var(--frost)/0.75)]" onClick={(e) => e.stopPropagation()}>
          <Btn onClick={p.onBack} disabled={!p.canBack} label="이전 / Back"><ChevronLeft className="h-4 w-4" /></Btn>
          <Btn onClick={p.toggleAuto} pressed={p.auto} label="자동 진행 / Auto">{p.auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}<span>자동</span></Btn>
          <Btn onClick={p.onSkip} label="스킵 / Skip"><FastForward className="h-3.5 w-3.5" /><span>스킵</span></Btn>
          <Btn onClick={p.onReplay} disabled={p.replayOff} label="다시 듣기 / Replay voice"><RotateCw className="h-3.5 w-3.5" /></Btn>
          {p.voiceLabel && <span className="ml-1 text-[10px] text-[hsl(var(--ember)/0.85)]">{p.voiceLabel}</span>}
          <div className="ml-auto flex items-center gap-2">
            <div className="h-px w-24 bg-[hsl(var(--frost)/0.2)] md:w-40"><div className="h-px bg-[hsl(var(--ember))] transition-[width] duration-700" style={{ width: `${Math.min(100, p.progress * 100)}%` }} /></div>
            {!p.isChoice && <button type="button" onClick={p.onNext} className="rounded-sm px-3 py-1.5 font-ui text-xs font-semibold text-[hsl(var(--parchment))] hover:bg-[hsl(var(--parchment)/0.1)]">다음 {p.subs && <span className="opacity-60">Next</span>}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChoiceRow({ onChoose, subs: sb }: { onChoose: (c: ChoiceId) => void; subs: boolean }) {
  return (
    <section data-layout="choice" className="wrap-text grid flex-1 grid-cols-1 content-end gap-2 px-3 pb-3 sm:grid-cols-2 md:px-8 lg:grid-cols-5" role="group" aria-label="갈 곳 선택 / Choose a path">
      {CHOICE.options.map((o, i) => {
        const s = SPEAKERS[o.speaker];
        return (
          <button key={o.id} type="button" onClick={() => onChoose(o.id)} className="rise group relative flex min-h-[170px] min-w-0 items-end overflow-hidden border border-[hsl(var(--parchment)/0.12)] text-left last:sm:col-span-2 last:lg:col-span-1 lg:min-h-[min(56dvh,460px)]" style={{ animationDelay: `${i * 140}ms` }}>
            <img src={`${BASE}${s.portrait}`} alt="" className="portrait-mask absolute inset-0 h-full w-full object-cover object-top opacity-55 transition-[opacity,transform] duration-700 group-hover:scale-[1.04] group-hover:opacity-100 group-focus-visible:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(214_40%_4%)] via-[hsl(214_40%_4%/0.3)] to-transparent" />
            <div className="relative min-w-0 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: s.tint }}>{o.label.ko}{sb && ` · ${o.label.en}`}</p>
              <p className="font-display text-xl font-extrabold leading-tight text-[hsl(var(--parchment))] xl:text-2xl">{s.name.ko}</p>
              <p className="mt-1 font-ui text-sm text-[hsl(var(--parchment)/0.9)]">{o.line.ko}</p>
              {sb && <p className="font-en text-sm italic text-[hsl(var(--frost)/0.8)]">{o.line.en}</p>}
            </div>
          </button>
        );
      })}
    </section>
  );
}

function Finale({ subs: sb, onRestart, onReselect }: { subs: boolean; onRestart: () => void; onReselect: () => void }) {
  return (
    <section data-layout="finale" aria-label="마무리 / Finale" className="fade wrap-text flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="flex w-full max-w-3xl flex-col items-center border border-[hsl(var(--parchment)/0.18)] bg-[hsl(214_40%_4%/0.72)] px-5 py-7 backdrop-blur-md md:px-10">
      <h2 className="font-display text-2xl font-extrabold text-[hsl(var(--parchment))]">함께 만드는 세계, 서울:전국</h2>
      <p className="my-3 max-w-2xl font-ui text-sm leading-relaxed text-[hsl(var(--parchment))]">
        누구나 참여하는 오픈 위키입니다. 세계관을 바탕으로 게임을 만들고, 새로운 설정을 제안하고, 인물을 소개해 주세요. 기여는 제출과 검토를 거쳐 공식 위키에 반영됩니다.
      </p>
      {sb && <p className="mb-4 max-w-2xl font-en text-sm text-[hsl(var(--frost))]">An open wiki for everyone. Build games in this setting, propose new lore, and introduce characters. Contributions enter the official wiki through submission and review.</p>}
      <a href={WIKI_URL} target="_blank" rel="noreferrer" className="flex max-w-full items-center gap-3 border border-[hsl(var(--parchment)/0.6)] bg-[hsl(214_40%_4%/0.7)] px-6 py-4 font-display text-lg font-extrabold text-[hsl(var(--parchment))] backdrop-blur hover:bg-[hsl(var(--parchment))] hover:text-[hsl(214_40%_6%)] md:text-xl">
        오픈 위키에서 세계관 살펴보기 <ExternalLink className="h-5 w-5 shrink-0" />
      </a>
      {sb && <p className="font-en mt-1 text-sm italic text-[hsl(var(--frost))]">Continue at sss.linalab.io/wiki</p>}
      <p className="mt-4 max-w-2xl font-ui text-xs leading-relaxed text-[hsl(var(--parchment)/0.8)]">
        프로젝트 소유 콘텐츠는 출처·이용 조건·변경 사항을 표시하면 각색과 상업적 이용이 가능합니다. 외부 자료 및 실존 인물의 이름·초상은 별도 조건을 확인해 주세요.
      </p>
      {sb && <p className="mt-1 max-w-2xl font-en text-xs text-[hsl(var(--frost))]">Project-owned content allows adaptation and commercial use with attribution, a link to its terms, and disclosure of changes. External materials and real people's names and likenesses require separate checks.</p>}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 font-ui text-xs underline underline-offset-4 text-[hsl(var(--parchment))]">
        <a href="https://github.com/islee23520/seoul-dengoku-wiki/blob/main/LICENSE" target="_blank" rel="noreferrer">콘텐츠 이용 조건 {sb && "· Terms"}</a>
        <a href={`${WIKI_URL}/world/Century-Annals`} target="_blank" rel="noreferrer">주요 사건 원문: 백년 연대기 {sb && "· Historical source"}</a>
        <a href={`${WIKI_URL}/world/Sixteen-States`} target="_blank" rel="noreferrer">십육국 원문 {sb && "· Sixteen States"}</a>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 font-ui text-xs">
        <button type="button" onClick={onReselect} className="px-3 py-2 text-[hsl(var(--parchment))] hover:bg-[hsl(var(--parchment)/0.1)]">다른 길 선택 {sb && "· Choose again"}</button>
        <button type="button" onClick={onRestart} className="flex items-center gap-1 px-3 py-2 text-[hsl(var(--frost))] hover:bg-[hsl(var(--parchment)/0.1)]"><RotateCcw className="h-3.5 w-3.5" />처음부터 {sb && "· Restart"}</button>
      </div>
      </div>
    </section>
  );
}

function Backlog({ steps, subs: sb, onClose, onJump }: { steps: Step[]; subs: boolean; onClose: () => void; onJump: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div role="dialog" aria-label="지난 이야기 / Backlog" data-layout="backlog" className="wrap-text fade fixed inset-0 z-[70] flex justify-end bg-[hsl(214_40%_3%/0.6)] backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} className="h-full w-full max-w-xl overflow-y-auto overscroll-contain bg-[hsl(214_32%_7%/0.96)] px-6 py-6" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 -mx-6 -mt-6 mb-4 flex items-center bg-[hsl(214_32%_7%)] px-6 py-4">
          <h2 className="font-display text-2xl font-extrabold text-[hsl(var(--parchment))]">지난 이야기</h2>
          {sb && <span className="font-en ml-2 italic text-[hsl(var(--frost)/0.7)]">Backlog</span>}
          <button type="button" onClick={onClose} aria-label="닫기 / Close" className="ml-auto p-2 text-[hsl(var(--frost))]"><X className="h-5 w-5" /></button>
        </div>
        {steps.map((s, i) => {
          const sp = SPEAKERS[s.line.speaker];
          const head = i === 0 || steps[i - 1].frame.key !== s.frame.key;
          return (
            <div key={s.line.id + i}>
              {head && <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--ember))]">{s.frame.year} · {s.frame.title}</p>}
              <button type="button" onClick={() => onJump(i)} className="mb-3 block w-full border-l-2 py-1 pl-3 text-left hover:bg-[hsl(var(--parchment)/0.05)]" style={{ borderColor: sp.tint }}>
                <span className="font-display text-sm font-bold" style={{ color: sp.tint }}>{sp.name.ko}</span>
                <span className="block text-[15px] leading-relaxed text-[hsl(var(--parchment))]">{s.line.ko}</span>
                {sb && <span className="font-en block text-sm italic text-[hsl(var(--frost)/0.7)]">{s.line.en}</span>}
                {EXHIBIT_BY_LINE[s.line.id] && (i === 0 || EXHIBIT_BY_LINE[steps[i - 1].line.id] !== EXHIBIT_BY_LINE[s.line.id]) && (
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ember)/0.8)]">자료 · {EXHIBIT_BY_LINE[s.line.id].heading.ko}{sb && ` / ${EXHIBIT_BY_LINE[s.line.id].heading.en}`}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopBar(p: { started: boolean; subs: boolean; setSubs: (f: (v: boolean) => boolean) => void; muted: boolean; setMuted: (f: (v: boolean) => boolean) => void; voiceMode: VoiceMode; setVoiceMode: (m: VoiceMode) => void; koOk: boolean; enOk: boolean; openLog: () => void }) {
  const opts: { m: VoiceMode; l: string; ok: boolean }[] = [{ m: "off", l: "OFF", ok: true }, { m: "ko", l: "한", ok: p.koOk }, { m: "en", l: "EN", ok: p.enOk }];
  return (
    <header data-layout="topbar" className="sticky top-0 z-[60] flex shrink-0 items-center gap-2 bg-gradient-to-b from-[hsl(214_40%_3%/0.85)] to-transparent px-4 py-3 md:px-8">
      <p className="font-display text-base font-extrabold text-[hsl(var(--parchment))] md:text-lg">서울<span className="text-[hsl(var(--ember))]">:</span>전국</p>
      <div className="ml-auto flex items-center gap-1 font-ui">
        <div role="radiogroup" aria-label="음성 / Voice" className="mr-1 flex border border-[hsl(var(--parchment)/0.2)] p-0.5">
          {opts.map((o) => (
            <button key={o.m} type="button" role="radio" aria-checked={p.voiceMode === o.m} disabled={!o.ok} onClick={() => p.setVoiceMode(o.m)} title={o.ok ? `음성 ${o.l}` : "이 브라우저에서 사용 불가 / Unavailable"}
              className={`h-7 min-w-8 px-1.5 font-mono text-[10px] font-bold disabled:opacity-30 ${p.voiceMode === o.m ? "bg-[hsl(var(--parchment))] text-[hsl(214_40%_6%)]" : "text-[hsl(var(--frost))]"}`}>{o.l}</button>
          ))}
        </div>
        <Btn onClick={() => p.setSubs((v) => !v)} pressed={p.subs} label="영어 자막 / English subtitles"><Subtitles className="h-4 w-4" /></Btn>
        <Btn onClick={() => p.setMuted((v) => !v)} pressed={p.muted} label="음소거 / Mute">{p.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Btn>
        {p.started && <Btn onClick={p.openLog} label="지난 이야기 / Backlog"><History className="h-4 w-4" /></Btn>}
      </div>
    </header>
  );
}

function Btn({ children, onClick, label, pressed, disabled }: { children: ReactNode; onClick: () => void; label: string; pressed?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed} disabled={disabled}
      className={`flex h-8 min-w-8 items-center justify-center gap-1 px-2 transition-colors disabled:opacity-30 ${pressed ? "text-[hsl(var(--ember))]" : "text-[hsl(var(--frost))]"} hover:bg-[hsl(var(--parchment)/0.1)]`}>
      {children}
    </button>
  );
}

function Title({ onBegin, subs: sb }: { onBegin: () => void; subs: boolean }) {
  return (
    <main data-layout="title" className="wrap-text relative z-20 flex flex-1 flex-col justify-end px-6 pb-14 pt-6 md:justify-center md:px-16 md:pb-10">
      <p className="rise font-mono text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--ember))]">모션 그림 동화 · 2030 — 2126</p>
      <h1 className="rise mt-4 font-display text-6xl font-extrabold leading-[0.95] text-[hsl(var(--parchment))] md:text-8xl lg:text-[8.5rem]" style={{ animationDelay: "200ms" }}>서울<span className="text-[hsl(var(--ember))]">:</span>전국</h1>
      <p className="rise mt-3 font-display text-2xl text-[hsl(var(--parchment)/0.9)] md:text-4xl" style={{ animationDelay: "350ms" }}>영원한 겨울의 연대기</p>
      {sb && <p className="rise font-en text-lg italic text-[hsl(var(--frost))] md:text-2xl" style={{ animationDelay: "420ms" }}>A Chronicle of the Eternal Winter</p>}
      <p className="rise mt-6 max-w-md text-base leading-relaxed text-[hsl(var(--parchment)/0.85)]" style={{ animationDelay: "550ms" }}>
        전령 이연이 얼어붙은 서울로 당신을 안내한다. 기록실, 차량기지, 무전 당직, 수서 창구, 분공방에서 다섯 사람을 만나며 열여섯 나라가 세 나라로 묶인 과정을 듣는다.
      </p>
      {sb && <p className="rise font-en mt-1 max-w-md italic text-[hsl(var(--frost)/0.8)]" style={{ animationDelay: "600ms" }}>The courier Iyen takes you through frozen Seoul to meet five people, at a records room, a depot, a radio watch, a ration counter and a workshop, and hear how sixteen states became three.</p>}
      <button type="button" onClick={onBegin} autoFocus className="rise group mt-8 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-1 border-b border-[hsl(var(--parchment)/0.5)] pb-2 text-[hsl(var(--parchment))]" style={{ animationDelay: "750ms" }}>
        <span className="font-display text-2xl font-extrabold">이야기 시작</span>
        <span className="font-en italic opacity-70">Begin the story</span>
        <span className="h-px w-10 bg-[hsl(var(--ember))] transition-transform duration-500 group-hover:scale-x-150" style={{ transformOrigin: "left" }} />
      </button>
      <p className="rise mt-8 max-w-lg font-ui text-[10px] leading-relaxed text-[hsl(var(--frost)/0.55)]" style={{ animationDelay: "900ms" }}>
        인물 대사는 공개 인물 기록에 근거한 쇼케이스 창작이며 정본 인용이 아닙니다. 음성은 기본 꺼짐.<br />{PORTRAIT_CREDIT.ko}<br />{PORTRAIT_CREDIT.en}
      </p>
    </main>
  );
}
