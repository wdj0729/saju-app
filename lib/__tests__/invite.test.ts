import { encodeInvite, decodeInvite } from '../invite';
import type { InvitePayload } from '../invite';

const valid: InvitePayload = {
  name: '홍길동',
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  isLunar: false,
  gender: 'M',
};

function encodeRaw(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

describe('encodeInvite / decodeInvite', () => {
  it('인코딩 후 디코딩하면 원본과 동일', () => {
    const encoded = encodeInvite(valid);
    expect(decodeInvite(encoded)).toEqual(valid);
  });

  it('hour가 null이어도 정상 동작', () => {
    const payload = { ...valid, hour: null };
    expect(decodeInvite(encodeInvite(payload))).toEqual(payload);
  });

  it('인코딩 결과에 +, /, = 없음 (URL-safe)', () => {
    const encoded = encodeInvite(valid);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('잘못된 문자열 → null', () => {
    expect(decodeInvite('not-valid-base64!!!!')).toBeNull();
  });

  it('필드 누락 → null', () => {
    expect(decodeInvite(encodeRaw({ name: '홍길동', year: 1990 }))).toBeNull();
  });

  it('year 범위 이탈 (1800) → null', () => {
    expect(decodeInvite(encodeRaw({ ...valid, year: 1800 }))).toBeNull();
  });

  it('month 범위 이탈 (13) → null', () => {
    expect(decodeInvite(encodeRaw({ ...valid, month: 13 }))).toBeNull();
  });

  it('day 범위 이탈 (32) → null', () => {
    expect(decodeInvite(encodeRaw({ ...valid, day: 32 }))).toBeNull();
  });

  it('day 범위 이탈 (0) → null', () => {
    expect(decodeInvite(encodeRaw({ ...valid, day: 0 }))).toBeNull();
  });

  it('gender 잘못된 값 → null', () => {
    expect(decodeInvite(encodeRaw({ ...valid, gender: 'X' }))).toBeNull();
  });
});
