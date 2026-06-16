import { makeOGImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const alt = '사주 분석 — 사주팔자';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return makeOGImage('🔮', '내 사주를 분석해보세요');
}
