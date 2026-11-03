import { useEffect, useState } from "react";

export type VoiceMode = "ko" | "en" | "off";

export interface VoiceAvailability {
  supported: boolean;
  ko: SpeechSynthesisVoice | null;
  en: SpeechSynthesisVoice | null;
  ready: boolean;
}

const pick = (voices: SpeechSynthesisVoice[], prefix: string) =>
  voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
  voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
  null;

export function useVoices(): VoiceAvailability {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [state, setState] = useState<VoiceAvailability>({ supported, ko: null, en: null, ready: !supported });

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const v = synth.getVoices();
      setState({ supported: true, ko: pick(v, "ko"), en: pick(v, "en"), ready: v.length > 0 });
    };
    load();
    synth.addEventListener("voiceschanged", load);
    const t = window.setTimeout(() => setState((s) => ({ ...s, ready: true })), 1500);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      window.clearTimeout(t);
    };
  }, [supported]);

  return state;
}

let current: SpeechSynthesisUtterance | null = null;

export function speak(text: string, voice: SpeechSynthesisVoice, onEnd: () => void) {
  stopSpeech();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = voice.lang.startsWith("ko") ? 1.02 : 0.98;
  u.pitch = 0.92;
  const done = () => {
    if (current !== u) return;
    current = null;
    onEnd();
  };
  u.onend = done;
  u.onerror = done;
  current = u;
  window.speechSynthesis.speak(u);
}

export function stopSpeech() {
  current = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
