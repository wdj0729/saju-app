'use client';

import { useEffect, useRef, useState } from 'react';

const YEAR_MAX = new Date().getFullYear();

export function clampYear(v: number): number {
  return Math.min(Math.max(v, 1900), YEAR_MAX);
}
export function clampMonth(v: number): number {
  return Math.min(Math.max(v, 1), 12);
}
export function clampDay(v: number, maxDay: number): number {
  return Math.min(Math.max(v, 1), maxDay);
}

interface DateInputProps {
  year: number;
  month: number;
  day: number;
  maxDay: number;
  onYearChange: (v: number) => void;
  onMonthChange: (v: number) => void;
  onDayChange: (v: number) => void;
}

const FIELD_CLASS =
  'bg-card border border-border rounded-xl text-primary text-sm text-center appearance-none py-3';

export default function DateInput({
  year,
  month,
  day,
  maxDay,
  onYearChange,
  onMonthChange,
  onDayChange,
}: DateInputProps) {
  const [yearStr, setYearStr] = useState(String(year));
  const [monthStr, setMonthStr] = useState(String(month).padStart(2, '0'));
  const [dayStr, setDayStr] = useState(String(day).padStart(2, '0'));

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  // Sync from parent when a profile is loaded externally
  useEffect(() => {
    if (Number(yearStr) !== year) setYearStr(String(year));
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Number(monthStr) !== month) setMonthStr(String(month).padStart(2, '0'));
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Number(dayStr) !== day) setDayStr(String(day).padStart(2, '0'));
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={yearStr}
        className={`${FIELD_CLASS} w-20 px-2`}
        placeholder="1993"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          setYearStr(v);
          if (v.length === 4) {
            onYearChange(clampYear(Number(v)));
            monthRef.current?.focus();
            monthRef.current?.select();
          } else {
            onYearChange(v ? Number(v) : year);
          }
        }}
        onBlur={() => {
          const clamped = clampYear(Number(yearStr) || 1900);
          setYearStr(String(clamped));
          onYearChange(clamped);
        }}
      />
      <span className="text-muted text-sm shrink-0">년</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={monthStr}
        className={`${FIELD_CLASS} w-12 px-1`}
        placeholder="06"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          setMonthStr(v);
          if (v.length === 2) {
            const clamped = clampMonth(Number(v));
            onMonthChange(clamped);
            dayRef.current?.focus();
            dayRef.current?.select();
          } else {
            onMonthChange(v ? Number(v) : month);
          }
        }}
        onBlur={() => {
          const clamped = clampMonth(Number(monthStr) || 1);
          setMonthStr(String(clamped).padStart(2, '0'));
          onMonthChange(clamped);
        }}
      />
      <span className="text-muted text-sm shrink-0">월</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={dayStr}
        className={`${FIELD_CLASS} w-12 px-1`}
        placeholder="15"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          setDayStr(v);
          onDayChange(v ? Number(v) : day);
        }}
        onBlur={() => {
          const clamped = clampDay(Number(dayStr) || 1, maxDay);
          setDayStr(String(clamped).padStart(2, '0'));
          onDayChange(clamped);
        }}
      />
      <span className="text-muted text-sm shrink-0">일</span>
    </div>
  );
}
