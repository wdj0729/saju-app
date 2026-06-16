import { makeOGImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';
import { getFortuneYear } from '@/lib/constants';

export const alt = '신년운세 — 사주팔자';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return makeOGImage('✨', `${getFortuneYear()} 신년운세`);
}
