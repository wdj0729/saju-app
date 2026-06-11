import { parseYearlySections, YEARLY_SECTION_KEYS } from '../useYearlySections';

describe('parseYearlySections', () => {
  it('빈 문자열 → 모든 섹션 빈 문자열', () => {
    expect(parseYearlySections('')).toEqual({
      총운: '',
      직업운: '',
      재물운: '',
      건강운: '',
      연애운: '',
    });
  });

  it('마커 없는 텍스트 → 모든 섹션 빈 문자열', () => {
    expect(parseYearlySections('아무 마커도 없는 텍스트')).toEqual({
      총운: '',
      직업운: '',
      재물운: '',
      건강운: '',
      연애운: '',
    });
  });

  it('마커 앞 텍스트는 버려짐', () => {
    const result = parseYearlySections('앞부분 텍스트\n[총운]\n총운 내용');
    expect(result['총운']).toBe('총운 내용');
    expect(result['직업운']).toBe('');
  });

  it('마커 1개 → 해당 섹션만 채워짐', () => {
    const result = parseYearlySections('[재물운]\n재물 내용입니다.');
    expect(result['재물운']).toBe('재물 내용입니다.');
    expect(result['총운']).toBe('');
    expect(result['건강운']).toBe('');
  });

  it('5개 섹션 전체 파싱', () => {
    const text = [
      '[총운]',
      '총운 내용',
      '[직업운]',
      '직업 내용',
      '[재물운]',
      '재물 내용',
      '[건강운]',
      '건강 내용',
      '[연애운]',
      '연애 내용',
    ].join('\n');
    const result = parseYearlySections(text);
    expect(result['총운']).toBe('총운 내용');
    expect(result['직업운']).toBe('직업 내용');
    expect(result['재물운']).toBe('재물 내용');
    expect(result['건강운']).toBe('건강 내용');
    expect(result['연애운']).toBe('연애 내용');
  });

  it('섹션 앞뒤 공백·개행 제거', () => {
    const text = '[총운]\n\n  내용이 있음  \n\n[직업운]\n직업';
    expect(parseYearlySections(text)['총운']).toBe('내용이 있음');
    expect(parseYearlySections(text)['직업운']).toBe('직업');
  });

  it('여러 줄 내용 보존', () => {
    const text = '[총운]\n첫째 줄\n둘째 줄\n셋째 줄\n[직업운]\n직업';
    expect(parseYearlySections(text)['총운']).toBe('첫째 줄\n둘째 줄\n셋째 줄');
  });

  it('YEARLY_SECTION_KEYS가 5개 항목을 올바른 순서로 포함', () => {
    expect(YEARLY_SECTION_KEYS).toEqual(['총운', '직업운', '재물운', '건강운', '연애운']);
  });
});
