/**
 * Bundled narration manifest for storyScript v6. Files: public/narration/<lineId>.<lang>.mp3
 * (e.g. v3-pro-01.ko.mp3). Clips match the current script; register
 * each line ID after its file exists. Unregistered lines fall back to labeled browser speech.
 */
export type NarrationLang = "ko" | "en";

export const BUNDLED_CLIPS: Record<NarrationLang, ReadonlySet<string>> = {
  ko: new Set<string>(["v3-pro-01","v3-pro-02","v4-pro-03","v3-pro-04","v4-open-01","v4-open-02","v4-open-03"]),
  en: new Set<string>(["v3-pro-01","v3-pro-02","v4-pro-03","v3-pro-04","v4-open-01","v4-open-02","v4-open-03"]),
};

export function clipUrl(lineId: string, lang: NarrationLang): string | null {
  if (!BUNDLED_CLIPS[lang].has(lineId)) return null;
  return `${import.meta.env.BASE_URL}narration/${lineId}.${lang}.mp3`;
}
