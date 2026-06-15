export type SectionKey = '성격분석' | '재물운' | '건강운' | '연애운' | '직업운';
export const SECTION_KEYS: SectionKey[] = ['성격분석', '재물운', '건강운', '연애운', '직업운'];

export function emptySections(): Record<SectionKey, string> {
  return { 성격분석: '', 재물운: '', 건강운: '', 연애운: '', 직업운: '' };
}

const SECTION_MARKER_RE = /\[(성격분석|재물운|건강운|연애운|직업운)\]/g;

export function parseSections(text: string): Record<SectionKey, string> {
  SECTION_MARKER_RE.lastIndex = 0;
  const result = emptySections();
  let match: RegExpExecArray | null;
  let lastKey: SectionKey | null = null;
  let lastIndex = 0;

  while ((match = SECTION_MARKER_RE.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as SectionKey;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}
