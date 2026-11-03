/**
 * Bundled narration manifest for storyScript v3. Files: public/narration/<lineId>.<lang>.mp3
 * (e.g. v3-pro-01.ko.mp3). Clips match the current script; register
 * each line ID after its file exists. Unregistered lines fall back to labeled browser speech.
 */
export type NarrationLang = "ko" | "en";

export const BUNDLED_CLIPS: Record<NarrationLang, ReadonlySet<string>> = {
  ko: new Set<string>(["v5-hook-01","v5-hook-02","v5-hook-03","v3-pro-01","v3-pro-02","v4-pro-03","v3-pro-04","v3-win-01","v3-win-02","v3-win-03","v3-win-04","v3-six-01","v3-six-02","v4-six-03","v3-six-04","v5-hist-01","v4-hist-02","v5-hist-03","v4-hist-04","v5-hist-05","v5-hist-06","v5-hist-07","v5-hist-08","v5-hist-09","v5-hist-10","v5-hist-11","v5-hist-12","v5-hist-13","v3-rec-01","v3-rec-02","v3-rec-03","v3-rec-04","v3-rec-05","v3-rec-06","v3-rec-07","v3-rte-01","v4-rte-02","v3-rte-03","v4-rte-04","v4-rte-05","v4-rte-06","v3-rte-07","v3-rte-08","v3-sig-01","v3-sig-02","v3-sig-03","v3-sig-04","v3-sig-05","v3-sig-06","v3-sig-07","v3-sig-08","v3-rel-01","v3-rel-02","v4-rel-03","v3-rel-04","v3-rel-05","v3-rel-06","v3-rel-07","v3-rel-08","v3-rel-09","v3-grn-01","v3-grn-02","v3-grn-03","v3-grn-04","v3-grn-05","v3-grn-06","v3-grn-07","v3-cho-01","v3-end-rec-01","v3-end-rec-02","v3-end-rte-01","v3-end-rte-02","v3-end-sig-01","v3-end-sig-02","v3-end-rel-01","v3-end-rel-02","v3-end-grn-01","v3-end-grn-02","v5-coda-01","v5-coda-02","v4-open-01","v4-open-02","v4-open-03"]),
  en: new Set<string>(["v5-hook-01","v5-hook-02","v5-hook-03","v3-pro-01","v3-pro-02","v4-pro-03","v3-pro-04","v3-win-01","v3-win-02","v3-win-03","v3-win-04","v3-six-01","v3-six-02","v4-six-03","v3-six-04","v5-hist-01","v4-hist-02","v5-hist-03","v4-hist-04","v5-hist-05","v5-hist-06","v5-hist-07","v5-hist-08","v5-hist-09","v5-hist-10","v5-hist-11","v5-hist-12","v5-hist-13","v3-rec-01","v3-rec-02","v3-rec-03","v3-rec-04","v3-rec-05","v3-rec-06","v3-rec-07","v3-rte-01","v4-rte-02","v3-rte-03","v4-rte-04","v4-rte-05","v4-rte-06","v3-rte-07","v3-rte-08","v3-sig-01","v3-sig-02","v3-sig-03","v3-sig-04","v3-sig-05","v3-sig-06","v3-sig-07","v3-sig-08","v3-rel-01","v3-rel-02","v4-rel-03","v3-rel-04","v3-rel-05","v3-rel-06","v3-rel-07","v3-rel-08","v3-rel-09","v3-grn-01","v3-grn-02","v3-grn-03","v3-grn-04","v3-grn-05","v3-grn-06","v3-grn-07","v3-cho-01","v3-end-rec-01","v3-end-rec-02","v3-end-rte-01","v3-end-rte-02","v3-end-sig-01","v3-end-sig-02","v3-end-rel-01","v3-end-rel-02","v3-end-grn-01","v3-end-grn-02","v5-coda-01","v5-coda-02","v4-open-01","v4-open-02","v4-open-03"]),
};

export function clipUrl(lineId: string, lang: NarrationLang): string | null {
  if (!BUNDLED_CLIPS[lang].has(lineId)) return null;
  return `${import.meta.env.BASE_URL}narration/${lineId}.${lang}.mp3`;
}
