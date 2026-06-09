import { ILGAN_TEXT } from '../ilgan-text';

const TEN_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

test('10천간 모두 설명 텍스트를 가진다', () => {
  for (const stem of TEN_STEMS) {
    expect(ILGAN_TEXT[stem]).toBeDefined();
    expect(typeof ILGAN_TEXT[stem]).toBe('string');
    expect(ILGAN_TEXT[stem].length).toBeGreaterThan(5);
  }
});

test('정확히 10개 항목이 있다', () => {
  expect(Object.keys(ILGAN_TEXT)).toHaveLength(10);
});
