/**
 * Supplemental reference panels (portrait cards with sources) that attach to
 * story lines by line ID. The v6 script (three factions, 2126 winter) has no
 * dated historical events to document, so no panel is attached and the old
 * state-flag and annals panels were removed with the old setting. The panel
 * plumbing stays so a future line can add one.
 *
 * HONESTY RULE: the public wiki contains NO photographs or depictions of events.
 * An image here must be a published wiki portrait of a person; the UI always
 * shows "관련 인물 초상 · 사건 현장 사진 아님". Files go under public/history/portraits/
 * (local webp re-encodes). Portraits are art-proposal status (canonPromotion false).
 *
 * Spoken text and line IDs are untouched; panels attach by line ID only.
 */

export type ExhibitKind = "portrait";
export interface ExhibitImage {
  kind: ExhibitKind;
  src: string;
  /** Wiki person id */
  ref: string;
  name: { ko: string; en: string };
  /** Role as recorded */
  role: { ko: string; en: string };
  /** Public wiki page for the image subject */
  href: string;
}
export interface Exhibit {
  id: string;
  date: string;
  heading: { ko: string; en: string };
  note: { ko: string; en: string };
  images: ExhibitImage[];
  /** Evidence: source anchors (route + description) */
  sources: { label: { ko: string; en: string }; href: string }[];
}

/** Line ID → panel. Only attaches; never alters spoken lines. Empty in v6. */
export const EXHIBIT_BY_LINE: Record<string, Exhibit> = {};

export const KIND_LABEL: Record<ExhibitKind, { ko: string; en: string }> = {
  portrait: { ko: "관련 인물 초상 · 사건 현장 사진 아님", en: "Related person's portrait · not an image of the event" },
};
export const EXHIBIT_CREDIT = {
  ko: "이미지: 서울:전국 위키 공개 초상(art-proposal, 정본 승인 아님). 이 사건들의 실제 현장 이미지는 위키에 없다.",
  en: "Images: published wiki portraits (art-proposal, not canon-approved). The wiki holds no actual depiction of these events.",
};
