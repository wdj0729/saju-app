import { ILJU_DETAIL } from '../ilju-detail';
import { ILJU_TEXT } from '../ilju-text';

describe('ILJU_DETAIL', () => {
  const textKeys = Object.keys(ILJU_TEXT);
  const detailKeys = Object.keys(ILJU_DETAIL);

  it('ILJU_TEXT와 동일한 60개 일주 키를 모두 가진다', () => {
    expect(detailKeys).toHaveLength(60);
    expect(new Set(detailKeys)).toEqual(new Set(textKeys));
  });

  it.each(detailKeys)('%s의 모든 필드가 비어 있지 않다', (key) => {
    const detail = ILJU_DETAIL[key];
    expect(detail.personality.trim().length).toBeGreaterThan(0);
    expect(detail.love.trim().length).toBeGreaterThan(0);
    expect(detail.career.trim().length).toBeGreaterThan(0);
    expect(detail.relationship.trim().length).toBeGreaterThan(0);
  });
});
