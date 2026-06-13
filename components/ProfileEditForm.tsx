'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import PersonInputFields from './PersonInputFields';

interface ProfileEditFormProps {
  profile: Profile;
  onSave: (id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<'M' | 'F'>(profile.gender ?? 'M');
  const [isLunar, setIsLunar] = useState(profile.isLunar);
  const [year, setYear] = useState(profile.year);
  const [month, setMonth] = useState(profile.month);
  const [day, setDay] = useState(profile.day);
  const [hourValue, setHourValue] = useState<number | null>(profile.hour);
  const [saveError, setSaveError] = useState('');

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSave() {
    setSaveError('');
    try {
      const result = calculateSaju({ year, month, day: clampedDay, hour: hourValue, isLunar });
      onSave(profile.id, {
        name,
        gender,
        isLunar,
        year,
        month,
        day: clampedDay,
        hour: hourValue,
        ilgan: result.ilgan,
      });
    } catch {
      setSaveError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="border-t border-border px-3 py-3 flex flex-col gap-3">
      <PersonInputFields
        name={name}
        onNameChange={setName}
        gender={gender}
        onGenderChange={setGender}
        isLunar={isLunar}
        onIsLunarChange={setIsLunar}
        year={year}
        month={month}
        day={clampedDay}
        maxDay={maxDay}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onDayChange={setDay}
        hourValue={hourValue}
        onHourChange={setHourValue}
      />
      {saveError && <p className="text-xs text-hwa text-center">{saveError}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm text-muted bg-card"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary-gradient text-white"
        >
          저장
        </button>
      </div>
    </div>
  );
}
