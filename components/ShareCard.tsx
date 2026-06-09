'use client';
import React from 'react';
import type { Ohaeng } from '@/lib/saju-data';

type SajuCardProps = {
  type: 'saju';
  name: string;
  ilgan: string;
  /** Each string is gan+ji concatenated, e.g. "甲子". Pass `pillar.gan + pillar.ji` from SajuResult. */
  pillars: { year: string; month: string; day: string; hour?: string };
  ohaeng: Record<Ohaeng, number>;
};

type CompatibilityCardProps = {
  type: 'compatibility';
  nameA: string;
  nameB: string;
  score: number;
  grade: string;
  gradeLabel: string;
  summary: string;
};

type FortuneCardProps = {
  type: 'fortune';
  name: string;
  ilgan: string;
  period: string;
  summary: string;
  date: string;
};

export type ShareCardProps = SajuCardProps | CompatibilityCardProps | FortuneCardProps;

const CARD: React.CSSProperties = {
  width: 320,
  height: 400,
  background: 'linear-gradient(135deg, #2a2a3e, #1e1e2e)',
  border: '1px solid #3a3a52',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontFamily: 'sans-serif',
  color: '#e8e8f0',
  boxSizing: 'border-box',
};

const OHAENG_COLORS: Record<Ohaeng, string> = {
  목: '#4ade80', 화: '#f87171', 토: '#facc15', 금: '#e2e8f0', 수: '#60a5fa',
};
const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];
const OHAENG_LABEL: Record<Ohaeng, string> = { 목:'木', 화:'火', 토:'土', 금:'金', 수:'水' };

function Badge() {
  return (
    <div style={{
      background: 'linear-gradient(to right, #667eea, #764ba2)',
      color: 'white',
      padding: '4px 14px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
    }}>
      사주팔자
    </div>
  );
}

function SajuInner({ name, ilgan, pillars, ohaeng }: SajuCardProps) {
  const cols = [
    { label: '年', value: pillars.year, highlight: false },
    { label: '月', value: pillars.month, highlight: false },
    { label: '日', value: pillars.day, highlight: true },
    { label: '時', value: pillars.hour ?? '?', highlight: false },
  ];
  const max = Math.max(...OHAENG_ORDER.map(k => ohaeng[k] ?? 0), 1);
  return (
    <>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🔮</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        {name ? `${name}의 사주` : '사주 결과'}
      </div>
      <div style={{ fontSize: 11, color: '#9090a8', marginBottom: 16 }}>{ilgan} 일간</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {cols.map(c => (
          <div key={c.label} style={{
            background: c.highlight ? 'rgba(102,126,234,0.15)' : '#32324a',
            border: c.highlight ? '1px solid #667eea' : '1px solid transparent',
            borderRadius: 10,
            padding: '8px 10px',
            textAlign: 'center',
            minWidth: 52,
          }}>
            <div style={{ fontSize: 9, color: '#9090a8', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 14 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ width: '100%', marginBottom: 20 }}>
        {OHAENG_ORDER.map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: '#9090a8', width: 14 }}>{OHAENG_LABEL[k]}</div>
            <div style={{ flex: 1, background: '#32324a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((ohaeng[k] ?? 0) / max) * 100}%`,
                background: OHAENG_COLORS[k],
                borderRadius: 4,
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto' }}><Badge /></div>
    </>
  );
}

function CompatibilityInner({ nameA, nameB, score, grade, gradeLabel, summary }: CompatibilityCardProps) {
  const GRADE_STARS: Record<string, string> = { 최상: '★★★★★', 상: '★★★★☆', 중: '★★★☆☆', 하: '★★☆☆☆' };
  const stars = GRADE_STARS[grade] ?? '★★☆☆☆';
  return (
    <>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💑</div>
      <div style={{ fontSize: 13, color: '#9090a8', marginBottom: 8 }}>{nameA} ♡ {nameB}</div>
      <div style={{
        fontSize: 56,
        fontWeight: 800,
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {score}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{stars}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#c8c8e0', marginBottom: 16 }}>
        {grade} · {gradeLabel}
      </div>
      <div style={{
        background: '#32324a',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 11,
        lineHeight: 1.7,
        color: '#c8c8e0',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: 16,
      }}>
        {summary.length > 80 ? summary.slice(0, 80) + '…' : summary}
      </div>
      <div style={{ marginTop: 'auto' }}><Badge /></div>
    </>
  );
}

function FortuneInner({ name, ilgan, period, summary, date }: FortuneCardProps) {
  return (
    <>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💫</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        {name ? `${name}의 ${period} 운세` : `${period} 운세`}
      </div>
      <div style={{ fontSize: 11, color: '#9090a8', marginBottom: 4 }}>{ilgan} 일간</div>
      <div style={{ fontSize: 10, color: '#9090a8', marginBottom: 20 }}>{date}</div>
      <div style={{
        background: '#32324a',
        borderRadius: 10,
        padding: 16,
        fontSize: 12,
        lineHeight: 1.8,
        color: '#c8c8e0',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {summary.length > 120 ? summary.slice(0, 120) + '…' : summary}
      </div>
      <div style={{ marginTop: 16 }}><Badge /></div>
    </>
  );
}

const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>((props, ref) => (
  <div aria-hidden="true" style={{ position: 'fixed', left: -9999, top: 0 }}>
    <div ref={ref} style={CARD}>
      {props.type === 'saju'          && <SajuInner          {...props} />}
      {props.type === 'compatibility' && <CompatibilityInner {...props} />}
      {props.type === 'fortune'       && <FortuneInner       {...props} />}
    </div>
  </div>
));
ShareCard.displayName = 'ShareCard';

export default ShareCard;
