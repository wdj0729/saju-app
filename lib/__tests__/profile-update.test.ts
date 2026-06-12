/**
 * @jest-environment jsdom
 */
import { updateProfile, loadProfiles } from '../../lib/profiles';

const SAMPLE_PROFILE = {
  id: 'test-id',
  name: '홍길동',
  year: 1990,
  month: 1,
  day: 1,
  hour: null,
  isLunar: false,
  gender: 'M' as const,
  ilgan: '갑',
  createdAt: 0,
};

beforeEach(() => {
  localStorage.setItem('saju-profiles', JSON.stringify([SAMPLE_PROFILE]));
});

afterEach(() => {
  localStorage.clear();
});

describe('updateProfile', () => {
  it('updates name while preserving other fields', () => {
    updateProfile('test-id', { name: '김철수' });
    const profiles = loadProfiles();
    expect(profiles[0].name).toBe('김철수');
    expect(profiles[0].year).toBe(1990);
    expect(profiles[0].id).toBe('test-id');
  });

  it('updates multiple fields at once', () => {
    updateProfile('test-id', { year: 1995, isLunar: true });
    const profiles = loadProfiles();
    expect(profiles[0].year).toBe(1995);
    expect(profiles[0].isLunar).toBe(true);
    expect(profiles[0].name).toBe('홍길동');
  });

  it('does nothing for unknown id', () => {
    updateProfile('other-id', { name: '김철수' });
    const profiles = loadProfiles();
    expect(profiles[0].name).toBe('홍길동');
  });
});
