/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import DateInput, { clampYear, clampMonth, clampDay } from '@/components/DateInput';

describe('clampYear / clampMonth / clampDay', () => {
  it('범위를 벗어난 값을 경계값으로 보정한다', () => {
    expect(clampYear(1800)).toBe(1900);
    expect(clampMonth(13)).toBe(12);
    expect(clampMonth(0)).toBe(1);
    expect(clampDay(31, 30)).toBe(30);
    expect(clampDay(0, 30)).toBe(1);
  });
});

describe('DateInput 보정 안내', () => {
  const noop = jest.fn();

  function setup() {
    render(
      <DateInput
        year={1993}
        month={6}
        day={15}
        maxDay={30}
        onYearChange={noop}
        onMonthChange={noop}
        onDayChange={noop}
      />
    );
  }

  it('범위를 벗어난 월을 입력하고 블러하면 보정 안내 문구가 뜬다', () => {
    setup();
    const monthInput = screen.getByLabelText('월');
    fireEvent.change(monthInput, { target: { value: '13' } });
    fireEvent.blur(monthInput);
    expect(screen.getByRole('status')).toHaveTextContent('월은 1~12 사이여야 해요');
    expect(monthInput).toHaveValue('12');
  });

  it('정상 범위 값은 보정 안내가 뜨지 않는다', () => {
    setup();
    const dayInput = screen.getByLabelText('일');
    fireEvent.change(dayInput, { target: { value: '20' } });
    fireEvent.blur(dayInput);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
