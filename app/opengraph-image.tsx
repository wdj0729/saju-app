import { makeOGImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const alt = '사주팔자 — AI 사주팔자 분석';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return makeOGImage('🔮', 'AI 사주팔자 분석');
}
