/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from '@/components/ShareButton';

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import html2canvas from 'html2canvas';

const mockHtml2Canvas = html2canvas as jest.Mock;

const fakeCanvas = {
  toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['fake'], { type: 'image/png' })),
} as unknown as HTMLCanvasElement;

const mockCardProps = {
  type: 'saju' as const,
  name: '홍길동',
  ilgan: '甲',
  pillars: {
    year: '甲子',
    month: '乙丑',
    day: '丙寅',
  },
  ohaeng: { 목: 1, 화: 2, 토: 1, 금: 1, 수: 1 } as Record<import('@/lib/saju-data').Ohaeng, number>,
};

function setNavigatorShare(opts: {
  canShare?: boolean;
  share?: (...args: unknown[]) => Promise<void>;
}) {
  Object.defineProperty(window.navigator, 'canShare', {
    value: opts.canShare === undefined ? undefined : jest.fn(() => opts.canShare),
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'share', {
    value: opts.share,
    configurable: true,
  });
}

beforeEach(() => {
  mockHtml2Canvas.mockReset();
  mockHtml2Canvas.mockResolvedValue(fakeCanvas);
  window.URL.createObjectURL = jest.fn(() => 'blob:fake-url');
  window.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  Object.defineProperty(window.navigator, 'canShare', { value: undefined, configurable: true });
  Object.defineProperty(window.navigator, 'share', { value: undefined, configurable: true });
});

describe('ShareButton', () => {
  it('공유 버튼이 렌더됨', () => {
    render(<ShareButton cardProps={mockCardProps} filename="test.png" shareTitle="테스트 공유" />);
    expect(screen.getByRole('button', { name: '결과 공유하기' })).toBeInTheDocument();
  });

  it('초기 상태에서 에러 메시지 없음', () => {
    render(<ShareButton cardProps={mockCardProps} filename="test.png" shareTitle="테스트 공유" />);
    expect(screen.queryByText(/공유에 실패했어요/)).not.toBeInTheDocument();
  });

  it('canShare가 true면 navigator.share를 파일과 함께 호출', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    setNavigatorShare({ canShare: true, share });

    render(<ShareButton cardProps={mockCardProps} filename="test.png" shareTitle="테스트 공유" />);
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const [{ files, title }] = share.mock.calls[0];
    expect(title).toBe('테스트 공유');
    expect(files[0].name).toBe('test.png');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '결과 공유하기' })).not.toBeDisabled()
    );
  });

  it('canShare를 지원하지 않으면 다운로드 링크로 폴백', async () => {
    setNavigatorShare({ canShare: undefined, share: undefined });
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ShareButton cardProps={mockCardProps} filename="test.png" shareTitle="테스트 공유" />);
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('사용자가 공유 시트를 취소(AbortError)하면 에러 메시지를 띄우지 않음', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    const share = jest.fn().mockRejectedValue(abortError);
    setNavigatorShare({ canShare: true, share });

    render(<ShareButton cardProps={mockCardProps} filename="test.png" shareTitle="테스트 공유" />);
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '결과 공유하기' })).not.toBeDisabled()
    );
    expect(screen.queryByText(/공유에 실패했어요/)).not.toBeInTheDocument();
  });

  it('공유 실패 시 에러 메시지를 표시하고 3초 후 사라짐', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const share = jest.fn().mockRejectedValue(new Error('공유 API 오류'));
    setNavigatorShare({ canShare: true, share });

    render(<ShareButton cardProps={mockCardProps} filename="test.png" shareTitle="테스트 공유" />);
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }));

    await waitFor(() => expect(screen.getByText(/공유에 실패했어요/)).toBeInTheDocument());

    jest.advanceTimersByTime(3000);
    await waitFor(() => expect(screen.queryByText(/공유에 실패했어요/)).not.toBeInTheDocument());

    jest.useRealTimers();
  });
});
