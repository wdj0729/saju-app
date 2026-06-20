/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ShareButton from '@/components/ShareButton';

const mockCardProps = {
  type: 'saju' as const,
  name: '홍길동',
  ilgan: '甲',
  pillars: {
    year: '甲子',
    month: '乙丑',
    day: '丙寅',
    hour: undefined,
  },
  ohaeng: {
    mok: 1,
    hwa: 2,
    to: 1,
    geum: 1,
    su: 1,
  },
};

describe('ShareButton', () => {
  it('공유 버튼이 렌더됨', () => {
    render(
      <ShareButton
        cardProps={mockCardProps}
        filename="test.png"
        shareTitle="테스트 공유"
      />
    );
    expect(screen.getByRole('button', { name: '결과 공유하기' })).toBeInTheDocument();
  });

  it('초기 상태에서 에러 메시지 없음', () => {
    render(
      <ShareButton
        cardProps={mockCardProps}
        filename="test.png"
        shareTitle="테스트 공유"
      />
    );
    expect(screen.queryByText(/공유에 실패했어요/)).not.toBeInTheDocument();
  });
});
