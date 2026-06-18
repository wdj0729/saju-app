export type SectionKey = '성격분석' | '재물운' | '건강운' | '연애운' | '직업운';
export const SECTION_KEYS: SectionKey[] = ['성격분석', '재물운', '건강운', '연애운', '직업운'];

export function emptySections(): Record<SectionKey, string> {
  return { 성격분석: '', 재물운: '', 건강운: '', 연애운: '', 직업운: '' };
}

export function parseSectionsByKeys<K extends string>(
  text: string,
  keys: readonly K[]
): Record<K, string> {
  const result = Object.fromEntries(keys.map((k) => [k, ''])) as Record<K, string>;
  const pattern = keys.map((k) => k.replace(/[[\]]/g, '\\$&')).join('|');
  const re = new RegExp(`\\[(${pattern})\\]`, 'g');
  let match: RegExpExecArray | null;
  let lastKey: K | null = null;
  let lastIndex = 0;

  while ((match = re.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as K;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}

export function parseSections(text: string): Record<SectionKey, string> {
  return parseSectionsByKeys(text, SECTION_KEYS);
}
