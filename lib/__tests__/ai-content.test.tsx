/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import AiContent from '@/components/AiContent';

describe('AiContent', () => {
  it('aiText/isStreaming/aiError 모두 없으면 분석 요청 버튼 표시', () => {
    const onRequest = jest.fn();
    render(
      <AiContent
        aiText=""
        isStreaming={false}
        aiError=""
        onRequest={onRequest}
        requestLabel="분석 요청하기"
      />
    );
    expect(screen.getByRole('button', { name: '분석 요청하기' })).toBeInTheDocument();
  });

  it('분석 요청 버튼 클릭 시 onRequest 호출', () => {
    const onRequest = jest.fn();
    render(<AiContent aiText="" isStreaming={false} aiError="" onRequest={onRequest} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('isStreaming=true이고 aiText=""이면 스켈레톤 표시 (버튼 없음)', () => {
    render(<AiContent aiText="" isStreaming={true} aiError="" onRequest={jest.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('isStreaming=true이고 aiText가 있으면 중단 버튼 표시', () => {
    const onAbort = jest.fn();
    render(
      <AiContent
        aiText="분석 중인 텍스트"
        isStreaming={true}
        aiError=""
        onRequest={jest.fn()}
        onAbort={onAbort}
      />
    );
    const abortBtn = screen.getByRole('button', { name: /분석 중단/ });
    expect(abortBtn).toBeInTheDocument();
    fireEvent.click(abortBtn);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it('aiError가 있으면 에러 메시지와 재시도 버튼 표시', () => {
    const onRequest = jest.fn();
    render(
      <AiContent
        aiText=""
        isStreaming={false}
        aiError="AI 오류가 발생했어요."
        onRequest={onRequest}
      />
    );
    expect(screen.getByText('AI 오류가 발생했어요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /재시도/ }));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });
});
