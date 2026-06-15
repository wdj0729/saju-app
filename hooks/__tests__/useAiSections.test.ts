import { parseSections, SECTION_KEYS } from '../../lib/saju-sections';

describe('parseSections', () => {
  it('빈 문자열 → 모든 섹션 빈 문자열', () => {
    expect(parseSections('')).toEqual({
      성격분석: '',
      재물운: '',
      건강운: '',
      연애운: '',
      직업운: '',
    });
  });

  it('마커 없는 텍스트 → 모든 섹션 빈 문자열', () => {
    expect(parseSections('아무 마커도 없는 텍스트')).toEqual({
      성격분석: '',
      재물운: '',
      건강운: '',
      연애운: '',
      직업운: '',
    });
  });

  it('마커 앞 텍스트는 버려짐', () => {
    const result = parseSections('앞부분 텍스트\n[성격분석]\n성격 내용');
    expect(result['성격분석']).toBe('성격 내용');
    expect(result['재물운']).toBe('');
  });

  it('마커 1개 → 해당 섹션만 채워짐', () => {
    const result = parseSections('[재물운]\n재물 내용입니다.');
    expect(result['재물운']).toBe('재물 내용입니다.');
    expect(result['성격분석']).toBe('');
    expect(result['건강운']).toBe('');
  });

  it('5개 섹션 전체 파싱', () => {
    const text = [
      '[성격분석]',
      '성격 내용',
      '[재물운]',
      '재물 내용',
      '[건강운]',
      '건강 내용',
      '[연애운]',
      '연애 내용',
      '[직업운]',
      '직업 내용',
    ].join('\n');
    const result = parseSections(text);
    expect(result['성격분석']).toBe('성격 내용');
    expect(result['재물운']).toBe('재물 내용');
    expect(result['건강운']).toBe('건강 내용');
    expect(result['연애운']).toBe('연애 내용');
    expect(result['직업운']).toBe('직업 내용');
  });

  it('섹션 앞뒤 공백·개행 제거', () => {
    const text = '[성격분석]\n\n  내용이 있음  \n\n[재물운]\n재물';
    expect(parseSections(text)['성격분석']).toBe('내용이 있음');
    expect(parseSections(text)['재물운']).toBe('재물');
  });

  it('여러 줄 내용 보존', () => {
    const text = '[성격분석]\n첫째 줄\n둘째 줄\n셋째 줄\n[재물운]\n재물';
    expect(parseSections(text)['성격분석']).toBe('첫째 줄\n둘째 줄\n셋째 줄');
  });

  it('SECTION_KEYS가 5개 항목을 올바른 순서로 포함', () => {
    expect(SECTION_KEYS).toEqual(['성격분석', '재물운', '건강운', '연애운', '직업운']);
  });
});
