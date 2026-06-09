'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';

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
const MONTHS = Array.from({ length: 12  }, (_, i) => i + 1);

const inputClass = 'w-full bg-card border border-border rounded-xl px-4 py-3 text-primary text-sm appearance-none';
const labelClass = 'block text-xs text-muted mb-1.5';

interface PersonFormProps {
  label: string;
  name: string; setName: (v: string) => void;
  isLunar: boolean; setIsLunar: (v: boolean) => void;
  year: number; setYear: (v: number) => void;
  month: number; setMonth: (v: number) => void;
  day: number; setDay: (v: number) => void;
  clampedDay: number;
  hourValue: number | null; setHourValue: (v: number | null) => void;
}

function PersonForm({
  label, name, setName, isLunar, setIsLunar,
  year, setYear, month, setMonth, day, setDay,
  clampedDay, hourValue, setHourValue,
}: PersonFormProps) {
  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();

  return (
    <div className="bg-card rounded-2xl px-4 py-4 flex flex-col gap-4">
      <p className="text-xs font-semibold text-primary">{label}</p>

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

      <div>
        <label className={labelClass}>양력 / 음력</label>
        <div className="flex gap-2">
          {([false, true] as const).map((lunar) => (
            <button
              key={String(lunar)}
              onClick={() => setIsLunar(lunar)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isLunar === lunar ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {lunar ? '음력' : '양력'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>생년</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass}>
          {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>생월</label>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
          {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>생일</label>
        <select value={clampedDay} onChange={(e) => setDay(Number(e.target.value))} className={inputClass}>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}일</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>태어난 시 (선택)</label>
        <select
          value={hourValue ?? ''}
          onChange={(e) => setHourValue(e.target.value === '' ? null : Number(e.target.value))}
          className={inputClass}
        >
          <option value="">모름</option>
          {SIJIN.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function CompatibilityPage() {
  const router = useRouter();

  const [nameA, setNameA]           = useState('');
  const [isLunarA, setIsLunarA]     = useState(false);
  const [yearA, setYearA]           = useState(1990);
  const [monthA, setMonthA]         = useState(1);
  const [dayA, setDayA]             = useState(1);
  const [hourValueA, setHourValueA] = useState<number | null>(null);

  const [nameB, setNameB]           = useState('');
  const [isLunarB, setIsLunarB]     = useState(false);
  const [yearB, setYearB]           = useState(1990);
  const [monthB, setMonthB]         = useState(1);
  const [dayB, setDayB]             = useState(1);
  const [hourValueB, setHourValueB] = useState<number | null>(null);

  const [error, setError] = useState('');

  const clampedDayA = Math.min(dayA, isLunarA ? 30 : new Date(yearA, monthA, 0).getDate());
  const clampedDayB = Math.min(dayB, isLunarB ? 30 : new Date(yearB, monthB, 0).getDate());

  function handleSubmit() {
    setError('');
    try {
      const resultA = calculateSaju({ year: yearA, month: monthA, day: clampedDayA, hour: hourValueA, isLunar: isLunarA });
      const resultB = calculateSaju({ year: yearB, month: monthB, day: clampedDayB, hour: hourValueB, isLunar: isLunarB });
      const compatibility = calcCompatibility(resultA, resultB);
      saveCompatSession({
        personA: { name: nameA, result: resultA },
        personB: { name: nameB, result: resultB },
        compatibility,
      });
      router.push('/compatibility/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 뒤로
        </button>
        <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <PersonForm
          label="💑 나의 정보"
          name={nameA} setName={setNameA}
          isLunar={isLunarA} setIsLunar={setIsLunarA}
          year={yearA} setYear={setYearA}
          month={monthA} setMonth={setMonthA}
          day={dayA} setDay={setDayA}
          clampedDay={clampedDayA}
          hourValue={hourValueA} setHourValue={setHourValueA}
        />

        <div className="flex items-center justify-center py-1">
          <span className="text-muted text-lg">♡</span>
        </div>

        <PersonForm
          label="💑 상대방 정보"
          name={nameB} setName={setNameB}
          isLunar={isLunarB} setIsLunar={setIsLunarB}
          year={yearB} setYear={setYearB}
          month={monthB} setMonth={setMonthB}
          day={dayB} setDay={setDayB}
          clampedDay={clampedDayB}
          hourValue={hourValueB} setHourValue={setHourValueB}
        />

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          궁합 분석하기
        </button>
      </div>
    </div>
  );
}
