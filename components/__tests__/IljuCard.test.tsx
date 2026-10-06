/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import IljuCard from '@/components/IljuCard';

describe('IljuCard', () => {
  it('기본 상태에는 기질 문구만 보이고 상세 섹션은 숨겨진다', () => {
    render(<IljuCard gan="甲" ji="子" />);
    expect(screen.getByText(/물 위에 뿌리 내린 거목/)).toBeInTheDocument();
    expect(screen.queryByText('성격')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /일주론 더 보기/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('버튼 클릭 시 성격/연애/직업/인간관계 4개 섹션이 펼쳐진다', () => {
    render(<IljuCard gan="甲" ji="子" />);

    fireEvent.click(screen.getByRole('button', { name: /일주론 더 보기/ }));

    expect(screen.getByText('성격')).toBeInTheDocument();
    expect(screen.getByText('연애')).toBeInTheDocument();
    expect(screen.getByText('직업')).toBeInTheDocument();
    expect(screen.getByText('인간관계')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /일주론 더 보기/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('ILJU_DETAIL에 없는 일주 조합이면 더보기 버튼을 렌더링하지 않는다', () => {
    render(<IljuCard gan="甲" ji="丑" />);
    expect(screen.queryByRole('button', { name: /일주론 더 보기/ })).not.toBeInTheDocument();
  });
});
