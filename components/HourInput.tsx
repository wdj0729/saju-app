'use client';

import { useState } from 'react';
import { SIJIN } from '@/lib/constants';

export function clockHourToSijin(hour: number): number {
  if (hour === 0 || hour === 23) return 0;
  return hour % 2 === 0 ? hour - 1 : hour;
}

interface HourInputProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

export default function HourInput({ value, onChange }: HourInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedLabel =
    value !== null ? (SIJIN.find((s) => s.value === value)?.label ?? '') : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPicker((prev) => !prev)}
          className={`flex-1 text-left px-3 py-3 rounded-xl border border-border text-sm transition-colors bg-card ${
            value === null ? 'text-muted' : 'text-primary'
          }`}
          aria-expanded={showPicker}
          aria-haspopup="listbox"
          aria-label="태어난 시"
        >
          {selectedLabel ?? '시 선택 (선택)'}
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setShowPicker(false);
          }}
          className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
            value === null ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
          }`}
        >
          모름
        </button>
      </div>

      {showPicker && (
        <div role="listbox" aria-label="시진 선택" className="grid grid-cols-2 gap-1.5">
          {SIJIN.map((s) => (
            <button
              key={s.value}
              type="button"
              role="option"
              aria-selected={value === s.value}
              onClick={() => {
                onChange(s.value);
                setShowPicker(false);
              }}
              className={`text-xs px-3 py-2.5 rounded-xl text-left transition-colors ${
                value === s.value
                  ? 'bg-primary-gradient text-white'
                  : 'bg-card text-muted hover:bg-card-hover hover:text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
