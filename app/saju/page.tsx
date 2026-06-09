'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

const SIJIN = [
  { label: '자시 (23·0시)',  value: 0  },
  { label: '축시 (1·2시)',   value: 1  },
  { label: '인시 (3·4시)',   value: 3  },
  { label: '묘시 (5·6시)',   value: 5  },
  { label: '진시 (7·8시)',   value: 7  },
  { label: '사시 (9·10시)',  value: 9  },
  { label: '오시 (11·12시)', value: 11 },
  { label: '미시 (13·14시)', value: 13 },
  { label: '신시 (15·16시)', value: 15 },
  { label: '유시 (17·18시)', value: 17 },
  { label: '술시 (19·20시)', value: 19 },
  { label: '해시 (21·22시)', value: 21 },
] as const;

const YEARS  = Array.from({ length: 201 }, (_, i) => 1900 + i);
const MONTHS = Array.from({ length: 12 },  (_, i) => i + 1);

export default function SajuInputPage() {
  const router = useRouter();
  const [name,      setName]      = useState('');
  const [isLunar,   setIsLunar]   = useState(false);
  const [year,      setYear]      = useState(1990);
  const [month,     setMonth]     = useState(1);
  const [day,       setDay]       = useState(1);
  const [hourValue, setHourValue] = useState<number | null>(null);
  const [error,     setError]     = useState('');

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSubmit() {
    setError('');
    try {
      const result = calculateSaju({ year, month, day: clampedDay, hour: hourValue, isLunar });
      saveSession({ input: { name, year, month, day: clampedDay, hour: hourValue, isLunar }, result });
      router.push('/saju/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  const inputClass =
    'w-full bg-card border border-border rounded-xl px-4 py-3 text-primary text-sm appearance-none';
  const labelClass = 'block text-xs text-muted mb-1.5';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 뒤로
        </button>
        <h1 className="text-sm font-semibold text-primary">생년월일시 입력</h1>
      </header>

      <div className="flex flex-col gap-5 px-4 py-6 flex-1">
        {/* 이름 */}
        <div>
          <label className={labelClass}>이름 (선택)</label>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* 양력/음력 토글 */}
        <div>
          <label className={labelClass}>양력 / 음력</label>
          <div className="flex gap-2">
            {([false, true] as const).map((lunar) => (
              <button
                key={String(lunar)}
                onClick={() => setIsLunar(lunar)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isLunar === lunar
                    ? 'bg-primary-gradient text-white'
                    : 'bg-card text-muted'
                }`}
              >
                {lunar ? '음력' : '양력'}
              </button>
            ))}
          </div>
        </div>

        {/* 생년 */}
        <div>
          <label className={labelClass}>생년</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={inputClass}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        {/* 생월 */}
        <div>
          <label className={labelClass}>생월</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={inputClass}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>

        {/* 생일 */}
        <div>
          <label className={labelClass}>생일</label>
          <select
            value={clampedDay}
            onChange={(e) => setDay(Number(e.target.value))}
            className={inputClass}
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>

        {/* 태어난 시 */}
        <div>
          <label className={labelClass}>태어난 시 (선택)</label>
          <select
            value={hourValue ?? ''}
            onChange={(e) =>
              setHourValue(e.target.value === '' ? null : Number(e.target.value))
            }
            className={inputClass}
          >
            <option value="">모름</option>
            {SIJIN.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-hwa text-center">{error}</p>
        )}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          사주 분석하기
        </button>
      </div>
    </div>
  );
}
