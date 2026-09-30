export function characterDraftExport<T extends { aiKey: string; aiModel: string; aiGenerating: boolean; aiMessage: string }>(sheet: T, personId: string) {
  const { aiKey, aiModel, aiGenerating, aiMessage, ...draft } = sheet
  return { ...draft, personId: personId || null }
}
