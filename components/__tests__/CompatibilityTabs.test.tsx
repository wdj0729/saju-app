/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import CompatibilityTabs from '@/components/CompatibilityTabs';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

function activeTabLabel() {
  return screen.getAllByRole('tab').find((el) => el.getAttribute('aria-selected') === 'true')
    ?.textContent;
}

describe('CompatibilityTabs', () => {
  it('/compatibility → 1:1 궁합 탭이 활성화됨', () => {
    mockUsePathname.mockReturnValue('/compatibility');
    render(<CompatibilityTabs />);
    expect(activeTabLabel()).toContain('1:1 궁합');
  });

  it('/compatibility/result → 1:1 궁합 탭이 활성화됨', () => {
    mockUsePathname.mockReturnValue('/compatibility/result');
    render(<CompatibilityTabs />);
    expect(activeTabLabel()).toContain('1:1 궁합');
  });

  it('/compatibility/group → 모임 궁합 탭이 활성화됨 (1:1 궁합의 접두사 매칭에 흡수되지 않음)', () => {
    mockUsePathname.mockReturnValue('/compatibility/group');
    render(<CompatibilityTabs />);
    expect(activeTabLabel()).toContain('모임 궁합');
  });

  it('/compatibility/group/result → 모임 궁합 탭이 활성화됨', () => {
    mockUsePathname.mockReturnValue('/compatibility/group/result');
    render(<CompatibilityTabs />);
    expect(activeTabLabel()).toContain('모임 궁합');
  });
});
