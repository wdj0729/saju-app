import { setPrefillA, getPrefillA, clearPrefillA } from '../compatibility-prefill';
import type { Profile } from '../profiles';
import { setupStorageMock } from './test-utils';

setupStorageMock('sessionStorage');

const mockProfile: Profile = {
  id: 'test-1',
  name: '홍길동',
  year: 1990,
  month: 5,
  day: 15,
  hour: null,
  isLunar: false,
  gender: 'M',
  ilgan: '甲',
  createdAt: 1000000,
};

describe('compatibility-prefill', () => {
  test('getPrefillA returns null when nothing stored', () => {
    expect(getPrefillA()).toBeNull();
  });

  test('setPrefillA stores profile, getPrefillA retrieves it', () => {
    setPrefillA(mockProfile);
    const result = getPrefillA();
    expect(result).toEqual(mockProfile);
  });

  test('clearPrefillA removes stored profile', () => {
    setPrefillA(mockProfile);
    clearPrefillA();
    expect(getPrefillA()).toBeNull();
  });

  test('getPrefillA returns null after clear', () => {
    setPrefillA(mockProfile);
    clearPrefillA();
    expect(getPrefillA()).toBeNull();
  });
});
