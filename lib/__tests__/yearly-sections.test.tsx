/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import YearlySections from '@/components/YearlySections';
import { emptyYearlySections } from '@/lib/yearly-sections';

describe('YearlySections', () => {
  it('섹션 없음/스트리밍 없음/에러 없음이면 분석 요청 버튼 표시', () => {
    const onRequest = jest.fn();
    render(
      <YearlySections
        sections={emptyYearlySections()}
        activeSection={null}
        isStreaming={false}
        aiError=""
        onRequest={onRequest}
      />
    );
    expect(screen.getByRole('button', { name: /신년운세 분석하기/ })).toBeInTheDocument();
  });

  it('부분 결과가 이미 있어도 스트리밍 도중 에러가 나면 에러 메시지를 표시한다', () => {
    // 회귀 테스트: AiContent/AiSections는 부분 결과가 있어도 에러 배너를 보여주도록
    // 고쳐졌는데(fd43f6f), YearlySections만 리팩토링에서 누락되어 hasContent가
    // true이면 aiError를 완전히 무시하던 버그.
    const sections = { ...emptyYearlySections(), 총운: '이미 스트리밍된 부분 결과' };
    render(
      <YearlySections
        sections={sections}
        activeSection={null}
        isStreaming={false}
        aiError="AI 서비스에 일시적인 오류가 발생했어요."
        onRequest={jest.fn()}
      />
    );
    expect(screen.getByText('AI 서비스에 일시적인 오류가 발생했어요.')).toBeInTheDocument();
    // 부분 결과 자체도 여전히 보존되어 있어야 한다.
    expect(screen.getByText('이미 스트리밍된 부분 결과')).toBeInTheDocument();
  });

  it('에러 배너의 다시 시도 버튼 클릭 시 onRequest 호출', () => {
    const onRequest = jest.fn();
    const sections = { ...emptyYearlySections(), 총운: '부분 결과' };
    render(
      <YearlySections
        sections={sections}
        activeSection={null}
        isStreaming={false}
        aiError="에러 발생"
        onRequest={onRequest}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('에러가 있으면 하단의 "다시 요청" 링크는 중복으로 표시하지 않는다', () => {
    const sections = { ...emptyYearlySections(), 총운: '부분 결과' };
    render(
      <YearlySections
        sections={sections}
        activeSection={null}
        isStreaming={false}
        aiError="에러 발생"
        onRequest={jest.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: '다시 요청' })).not.toBeInTheDocument();
  });

  it('에러 없이 결과가 완료되면 "다시 요청" 링크를 표시', () => {
    const sections = { ...emptyYearlySections(), 총운: '완료된 결과' };
    render(
      <YearlySections
        sections={sections}
        activeSection={null}
        isStreaming={false}
        aiError=""
        onRequest={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '다시 요청' })).toBeInTheDocument();
  });

  it('스트리밍 중 중단 버튼 클릭 시 onAbort 호출', () => {
    const onAbort = jest.fn();
    const sections = { ...emptyYearlySections(), 총운: '스트리밍 중' };
    render(
      <YearlySections
        sections={sections}
        activeSection="총운"
        isStreaming={true}
        aiError=""
        onRequest={jest.fn()}
        onAbort={onAbort}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /분석 중단/ }));
    expect(onAbort).toHaveBeenCalledTimes(1);
  });
});
