import { calcGroupCompatibility } from '../group-compatibility';
import type { GroupMember } from '../group-compatibility';
import type { SajuResult } from '../saju-calculator';

function makeMember(
  ilgan: string,
  ohaengValues: [number, number, number, number, number]
): GroupMember {
  const [목, 화, 토, 금, 수] = ohaengValues;
  const result: SajuResult = {
    year: { gan: '갑', ji: '자', ganElement: '목', jiElement: '수' },
    month: { gan: '갑', ji: '자', ganElement: '목', jiElement: '수' },
    day: { gan: ilgan, ji: '자', ganElement: '목', jiElement: '수' },
    hour: null,
    ilgan,
    ohaeng: { 목, 화, 토, 금, 수 },
  };
  return { name: `${ilgan}인`, gender: 'M', result };
}

describe('calcGroupCompatibility', () => {
  it('2명: 쌍 1개 반환', () => {
    const members = [makeMember('갑', [4, 2, 1, 1, 1]), makeMember('병', [1, 4, 2, 1, 1])];
    const { pairs, averageScore } = calcGroupCompatibility(members);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].indexA).toBe(0);
    expect(pairs[0].indexB).toBe(1);
    expect(typeof pairs[0].score).toBe('number');
    expect(['최상', '상', '중', '하']).toContain(pairs[0].grade);
    expect(averageScore).toBe(pairs[0].score);
  });

  it('3명: 쌍 3개 반환', () => {
    const members = [
      makeMember('갑', [4, 2, 1, 1, 1]),
      makeMember('병', [1, 4, 2, 1, 1]),
      makeMember('무', [1, 1, 4, 2, 1]),
    ];
    const { pairs } = calcGroupCompatibility(members);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toMatchObject({ indexA: 0, indexB: 1 });
    expect(pairs[1]).toMatchObject({ indexA: 0, indexB: 2 });
    expect(pairs[2]).toMatchObject({ indexA: 1, indexB: 2 });
  });

  it('4명: 쌍 6개 반환', () => {
    const members = Array.from({ length: 4 }, (_, i) => makeMember('갑', [4 - i, i + 1, 1, 1, 1]));
    const { pairs } = calcGroupCompatibility(members);
    expect(pairs).toHaveLength(6);
  });

  it('averageScore는 쌍 점수 평균 (반올림)', () => {
    const members = [
      makeMember('갑', [4, 2, 1, 1, 1]),
      makeMember('병', [1, 4, 2, 1, 1]),
      makeMember('무', [1, 1, 4, 2, 1]),
    ];
    const { pairs, averageScore } = calcGroupCompatibility(members);
    const expected = Math.round(pairs.reduce((s, p) => s + p.score, 0) / pairs.length);
    expect(averageScore).toBe(expected);
  });

  it('각 pair에 gradeLabel 포함', () => {
    const members = [makeMember('갑', [4, 2, 1, 1, 1]), makeMember('병', [1, 4, 2, 1, 1])];
    const { pairs } = calcGroupCompatibility(members);
    expect(typeof pairs[0].gradeLabel).toBe('string');
    expect(pairs[0].gradeLabel.length).toBeGreaterThan(0);
  });
});
