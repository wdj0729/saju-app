import { clockHourToSijin } from '../../components/HourInput';

describe('clockHourToSijin', () => {
  it('maps 0 to 자시 (0)', () => expect(clockHourToSijin(0)).toBe(0));
  it('maps 23 to 자시 (0)', () => expect(clockHourToSijin(23)).toBe(0));
  it('maps 1 to 축시 (1)', () => expect(clockHourToSijin(1)).toBe(1));
  it('maps 2 to 축시 (1)', () => expect(clockHourToSijin(2)).toBe(1));
  it('maps 3 to 인시 (3)', () => expect(clockHourToSijin(3)).toBe(3));
  it('maps 4 to 인시 (3)', () => expect(clockHourToSijin(4)).toBe(3));
  it('maps 14 to 미시 (13)', () => expect(clockHourToSijin(14)).toBe(13));
  it('maps 21 to 해시 (21)', () => expect(clockHourToSijin(21)).toBe(21));
  it('maps 22 to 해시 (21)', () => expect(clockHourToSijin(22)).toBe(21));
});
