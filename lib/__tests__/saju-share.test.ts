import { encodeSajuShare, decodeSajuShare } from '../saju-share';
import type { SajuSharePayload } from '../saju-share';

const valid: SajuSharePayload = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  isLunar: false,
  gender: 'M',
  name: '홍길동',
};

function encodeRaw(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

describe('encodeSajuShare / decodeSajuShare', () => {
  it('인코딩 후 디코딩하면 원본과 동일', () => {
    expect(decodeSajuShare(encodeSajuShare(valid))).toEqual(valid);
  });

  it('hour null, name 없어도 동작', () => {
    const p: SajuSharePayload = {
      year: 1990,
      month: 1,
      day: 1,
      hour: null,
      isLunar: true,
      gender: 'F',
    };
    expect(decodeSajuShare(encodeSajuShare(p))).toEqual(p);
  });

  it('인코딩 결과에 +, /, = 없음 (URL-safe)', () => {
    expect(encodeSajuShare(valid)).not.toMatch(/[+/=]/);
  });

  it('잘못된 문자열 → null', () => {
    expect(decodeSajuShare('not-valid!!!!')).toBeNull();
  });

  it('year 범위 이탈 (1800) → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, year: 1800 }))).toBeNull();
  });

  it('month 범위 이탈 (13) → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, month: 13 }))).toBeNull();
  });

  it('day 범위 이탈 (0) → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, day: 0 }))).toBeNull();
  });

  it('gender 잘못된 값 → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, gender: 'X' }))).toBeNull();
  });

  it('필드 누락 → null', () => {
    expect(decodeSajuShare(encodeRaw({ year: 1990, month: 5 }))).toBeNull();
  });
});
