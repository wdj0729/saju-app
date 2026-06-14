'use client';

import { useEffect, useRef, useState } from 'react';

export function clampYear(v: number): number {
  return Math.min(Math.max(v, 1900), new Date().getFullYear());
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
  'bg-card border border-border rounded-xl text-primary text-base text-center appearance-none py-3';

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

  // Refs track the latest input value synchronously so onBlur closures
  // are not stale when focus() triggers blur mid-onChange batch.
  const yearStrRef = useRef(String(year));
  const monthStrRef = useRef(String(month).padStart(2, '0'));

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  // Sync from parent when a profile is loaded externally
  useEffect(() => {
    const v = String(year);
    yearStrRef.current = v;
    setYearStr(v);
  }, [year]);
  useEffect(() => {
    const v = String(month).padStart(2, '0');
    monthStrRef.current = v;
    setMonthStr(v);
  }, [month]);
  useEffect(() => {
    setDayStr(String(day).padStart(2, '0'));
  }, [day]);

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
        aria-label="년도"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          yearStrRef.current = v;
          setYearStr(v);
          if (v.length === 4) {
            onYearChange(clampYear(Number(v)));
            monthRef.current?.focus();
            monthRef.current?.select();
          }
        }}
        onBlur={() => {
          const current = yearStrRef.current;
          if (current.length < 4) {
            const reset = String(year);
            yearStrRef.current = reset;
            setYearStr(reset);
            return;
          }
          const clamped = clampYear(Number(current));
          const clamped_str = String(clamped);
          yearStrRef.current = clamped_str;
          setYearStr(clamped_str);
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
        aria-label="월"
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          monthStrRef.current = v;
          setMonthStr(v);
          if (v.length === 2) {
            const clamped = clampMonth(Number(v));
            onMonthChange(clamped);
            dayRef.current?.focus();
            dayRef.current?.select();
          }
        }}
        onBlur={() => {
          const clamped = clampMonth(Number(monthStrRef.current) || 1);
          const padded = String(clamped).padStart(2, '0');
          monthStrRef.current = padded;
          setMonthStr(padded);
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
        aria-label="일"
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          setDayStr(v);
          if (v.length === 2) {
            onDayChange(clampDay(Number(v), maxDay));
          }
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
