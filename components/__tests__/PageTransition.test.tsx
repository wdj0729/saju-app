/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import PageTransition from '@/components/PageTransition';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('PageTransition', () => {
  it('children을 렌더링하고 fade 애니메이션 클래스를 적용한다', () => {
    mockUsePathname.mockReturnValue('/');
    render(
      <PageTransition>
        <p>홈 내용</p>
      </PageTransition>
    );
    expect(screen.getByText('홈 내용')).toBeInTheDocument();
    expect(screen.getByText('홈 내용').parentElement).toHaveClass('page-fade-in');
  });

  it('경로가 바뀌면 컨테이너가 다시 마운트되어 애니메이션이 재생된다', () => {
    mockUsePathname.mockReturnValue('/saju');
    const { rerender } = render(
      <PageTransition>
        <p>사주 내용</p>
      </PageTransition>
    );
    const before = screen.getByText('사주 내용').parentElement;

    mockUsePathname.mockReturnValue('/fortune');
    rerender(
      <PageTransition>
        <p>운세 내용</p>
      </PageTransition>
    );
    expect(screen.getByText('운세 내용')).toBeInTheDocument();
    expect(screen.getByText('운세 내용').parentElement).not.toBe(before);
  });
});
