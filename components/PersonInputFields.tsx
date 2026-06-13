'use client';

import { INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import DateInput from './DateInput';
import HourInput from './HourInput';

interface PersonInputFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  gender: 'M' | 'F';
  onGenderChange: (v: 'M' | 'F') => void;
  isLunar: boolean;
  onIsLunarChange: (v: boolean) => void;
  year: number;
  month: number;
  day: number;
  maxDay: number;
  onYearChange: (v: number) => void;
  onMonthChange: (v: number) => void;
  onDayChange: (v: number) => void;
  hourValue: number | null;
  onHourChange: (v: number | null) => void;
  showOptionalHints?: boolean;
  namePlaceholder?: string;
}

export default function PersonInputFields({
  name,
  onNameChange,
  gender,
  onGenderChange,
  isLunar,
  onIsLunarChange,
  year,
  month,
  day,
  maxDay,
  onYearChange,
  onMonthChange,
  onDayChange,
  hourValue,
  onHourChange,
  showOptionalHints = false,
  namePlaceholder,
}: PersonInputFieldsProps) {
  return (
    <>
      <div>
        <label className={LABEL_CLASS}>
          이름{showOptionalHints ? ' (선택)' : ''}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>성별</label>
        <div className="flex gap-2">
          {(['M', 'F'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGenderChange(g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                gender === g ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {g === 'M' ? '남성' : '여성'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL_CLASS}>양력 / 음력</label>
        <div className="flex gap-2">
          {([false, true] as const).map((lunar) => (
            <button
              key={String(lunar)}
              type="button"
              onClick={() => onIsLunarChange(lunar)}
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
        <label className={LABEL_CLASS}>생년월일</label>
        <DateInput
          year={year}
          month={month}
          day={day}
          maxDay={maxDay}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          onDayChange={onDayChange}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>
          태어난 시{showOptionalHints ? ' (선택)' : ''}
        </label>
        <HourInput value={hourValue} onChange={onHourChange} />
      </div>
    </>
  );
}
