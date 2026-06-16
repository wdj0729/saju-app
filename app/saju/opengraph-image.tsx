import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = '사주 분석 — 사주팔자';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.ttf'));

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
      <div style={{ fontSize: 80 }}>🔮</div>
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
        내 사주를 분석해보세요
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
