export type YearlySectionKey = '총운' | '직업운' | '재물운' | '건강운' | '연애운';
export const YEARLY_SECTION_KEYS: YearlySectionKey[] = [
  '총운',
  '직업운',
  '재물운',
  '건강운',
  '연애운',
];

export function emptyYearlySections(): Record<YearlySectionKey, string> {
  return { 총운: '', 직업운: '', 재물운: '', 건강운: '', 연애운: '' };
}

export function parseYearlySections(text: string): Record<YearlySectionKey, string> {
  const result = emptyYearlySections();
  const markerRegex = /\[(총운|직업운|재물운|건강운|연애운)\]/g;
  let match: RegExpExecArray | null;
  let lastKey: YearlySectionKey | null = null;
  let lastIndex = 0;

  while ((match = markerRegex.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as YearlySectionKey;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}
