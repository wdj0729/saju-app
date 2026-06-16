import { makeOGImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const alt = '오늘 운세 — 사주팔자';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return makeOGImage('💫', '오늘 운세 확인하기');
}
