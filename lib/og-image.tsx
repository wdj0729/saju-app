import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.ttf'));

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

export function makeOGImage(emoji: string, tagline: string): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        background: '#1e1e2e',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
      }}
    >
      <div style={{ fontSize: 80 }}>{emoji}</div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: 'Noto Sans KR',
          letterSpacing: '-1px',
        }}
      >
        사주팔자
      </div>
      <div
        style={{
          fontSize: 26,
          color: '#a0a0b0',
          fontFamily: 'Noto Sans KR',
        }}
      >
        {tagline}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
