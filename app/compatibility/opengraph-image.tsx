import { makeOGImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const alt = '궁합 분석 — 사주팔자';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return makeOGImage('💑', '두 사람의 궁합 분석');
}
