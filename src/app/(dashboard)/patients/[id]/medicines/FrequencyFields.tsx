"use client";

import type { FrequencyType } from "@/lib/types/database";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function FrequencyFields({
  frequencyType,
  anchorDate,
  setAnchorDate,
  weekdays,
  setWeekdays,
  dayOfMonth,
  setDayOfMonth,
  dates,
  setDates,
}: {
  frequencyType: FrequencyType;
  anchorDate: string;
  setAnchorDate: (v: string) => void;
  weekdays: number[];
  setWeekdays: (v: number[]) => void;
  dayOfMonth: number;
  setDayOfMonth: (v: number) => void;
  dates: string[];
  setDates: (v: string[]) => void;
}) {
  if (frequencyType === "everyday") {
    return null;
  }

  if (frequencyType === "alternate") {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">
          Anchor date (due every 2 days from here)
        </label>
        <input
          type="date"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
          required
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
    );
  }

  if (frequencyType === "weekly") {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Weekdays</label>
        <div className="flex gap-2">
          {WEEKDAY_LABELS.map((label, idx) => {
            const checked = weekdays.includes(idx);
            return (
              <label key={idx} className="flex flex-col items-center gap-1 text-xs text-zinc-600">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setWeekdays(checked ? weekdays.filter((d) => d !== idx) : [...weekdays, idx].sort())
                  }
                />
                {label}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (frequencyType === "monthly") {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Day of month</label>
        <input
          type="number"
          min={1}
          max={31}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Number(e.target.value))}
          required
          className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
    );
  }

  // specific_dates
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-600">Specific dates</label>
      <div className="flex flex-wrap items-center gap-2">
        {dates.map((date, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
          >
            {date}
            <button
              type="button"
              onClick={() => setDates(dates.filter((_, i) => i !== idx))}
              className="text-zinc-400 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="date"
          onChange={(e) => {
            if (e.target.value && !dates.includes(e.target.value)) {
              setDates([...dates, e.target.value].sort());
            }
            e.target.value = "";
          }}
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}
