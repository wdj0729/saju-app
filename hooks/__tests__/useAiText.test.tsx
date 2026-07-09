/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { useAiText } from '@/hooks/useAiText';
import { saveAiCache } from '@/lib/ai-cache';

beforeEach(() => {
  localStorage.clear();
});

function TestComponent({
  cacheKey,
  onRender,
}: {
  cacheKey: string;
  onRender: (v: string) => void;
}) {
  const { aiText } = useAiText(cacheKey);
  onRender(aiText);
  return null;
}

describe('useAiText', () => {
  it('캐시된 결과가 있으면 최초 렌더부터 즉시 반영된다 (effect 이후가 아님)', () => {
    const cacheKey = 'test-key';
    saveAiCache(cacheKey, { ai: '캐시된 분석 결과' });

    const renders: string[] = [];
    render(<TestComponent cacheKey={cacheKey} onRender={(v) => renders.push(v)} />);

    // 최초 렌더(commit 이전) 시점에 이미 캐시 값이 반영되어야 하며,
    // 빈 문자열로 렌더된 뒤 effect에서 뒤늦게 채워지는 깜빡임이 없어야 한다.
    expect(renders[0]).toBe('캐시된 분석 결과');
    expect(renders.every((v) => v === '캐시된 분석 결과')).toBe(true);
  });

  it('캐시가 없으면 빈 문자열로 시작한다', () => {
    const renders: string[] = [];
    render(<TestComponent cacheKey="no-such-key" onRender={(v) => renders.push(v)} />);

    expect(renders[0]).toBe('');
  });
});
