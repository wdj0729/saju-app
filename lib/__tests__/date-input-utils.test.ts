import { clampYear, clampMonth, clampDay } from '../../components/DateInput';

describe('clampYear', () => {
  it('clamps below minimum to 1900', () => {
    expect(clampYear(1000)).toBe(1900);
  });
  it('clamps above current year', () => {
    const currentYear = new Date().getFullYear();
    expect(clampYear(currentYear + 5)).toBe(currentYear);
  });
  it('passes through valid year', () => {
    expect(clampYear(1990)).toBe(1990);
  });
});

describe('clampMonth', () => {
  it('clamps 0 to 1', () => expect(clampMonth(0)).toBe(1));
  it('clamps 13 to 12', () => expect(clampMonth(13)).toBe(12));
  it('passes through 6', () => expect(clampMonth(6)).toBe(6));
});

describe('clampDay', () => {
  it('clamps 0 to 1', () => expect(clampDay(0, 31)).toBe(1));
  it('clamps above maxDay', () => expect(clampDay(32, 31)).toBe(31));
  it('passes through valid day', () => expect(clampDay(15, 31)).toBe(15));
  it('respects maxDay of 28 (Feb non-leap)', () => expect(clampDay(30, 28)).toBe(28));
});
