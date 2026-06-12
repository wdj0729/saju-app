'use client';

import { useEffect, useRef, useState } from 'react';
import { SIJIN } from '@/lib/constants';

export function clockHourToSijin(hour: number): number {
  if (hour === 0 || hour === 23) return 0;
  return hour % 2 === 0 ? hour - 1 : hour;
}

interface HourInputProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

const FIELD_CLASS =
  'bg-card border border-border rounded-xl text-primary text-sm text-center appearance-none py-3';

export default function HourInput({ value, onChange }: HourInputProps) {
  const [hourStr, setHourStr] = useState(value !== null ? String(value).padStart(2, '0') : '');
  const lastEmitted = useRef<number | null>(value);

  useEffect(() => {
    // Only sync from parent when value changed externally (not from our own onChange)
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setHourStr(value !== null ? String(value).padStart(2, '0') : '');
  }, [value]);

  const sijinLabel = value !== null ? (SIJIN.find((s) => s.value === value)?.label ?? '') : '';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={hourStr}
          placeholder="--"
          aria-label="태어난 시"
          className={`${FIELD_CLASS} w-12 px-1`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
            setHourStr(v);
            if (v.length === 2) {
              const h = Math.min(Number(v), 23);
              const sijin = clockHourToSijin(h);
              lastEmitted.current = sijin;
              onChange(sijin);
            }
          }}
          onBlur={() => {
            if (hourStr === '') {
              lastEmitted.current = null;
              onChange(null);
              return;
            }
            const h = Math.min(Number(hourStr) || 0, 23);
            setHourStr(String(h).padStart(2, '0'));
            const sijin = clockHourToSijin(h);
            lastEmitted.current = sijin;
            onChange(sijin);
          }}
        />
        <span className="text-muted text-sm shrink-0">시</span>
      </div>
      {value !== null && <span className="text-xs text-muted shrink-0">{sijinLabel}</span>}
      <button
        type="button"
        onClick={() => {
          setHourStr('');
          lastEmitted.current = null;
          onChange(null);
        }}
        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ml-auto ${
          value === null ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
        }`}
      >
        모름
      </button>
    </div>
  );
}
