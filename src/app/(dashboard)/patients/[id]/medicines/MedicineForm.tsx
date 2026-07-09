"use client";

import { useActionState, useState } from "react";
import type { FrequencyType, Medicine, Session } from "@/lib/types/database";
import { createMedicine, updateMedicine, type MedicineFormState } from "./actions";
import FrequencyFields from "./FrequencyFields";

const initialState: MedicineFormState = { error: null };

function extractInitial(medicine: Medicine | undefined) {
  const config = medicine?.frequency_config ?? {};
  return {
    anchorDate: "anchor_date" in config ? config.anchor_date : "",
    weekdays: "weekdays" in config ? config.weekdays : [],
    dayOfMonth: "day_of_month" in config ? config.day_of_month : 1,
    dates: "dates" in config ? config.dates : [],
  };
}

export default function MedicineForm({
  patientId,
  sessions,
  medicine,
  onDone,
}: {
  patientId: string;
  sessions: Session[];
  medicine?: Medicine;
  onDone?: () => void;
}) {
  const boundAction = medicine
    ? updateMedicine.bind(null, patientId, medicine.id)
    : createMedicine.bind(null, patientId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    medicine?.frequency_type ?? "everyday",
  );
  const init = extractInitial(medicine);
  const [anchorDate, setAnchorDate] = useState(init.anchorDate);
  const [weekdays, setWeekdays] = useState<number[]>(init.weekdays);
  const [dayOfMonth, setDayOfMonth] = useState(init.dayOfMonth);
  const [dates, setDates] = useState<string[]>(init.dates);

  function buildFrequencyConfig(): string {
    switch (frequencyType) {
      case "alternate":
        return JSON.stringify({ anchor_date: anchorDate });
      case "weekly":
        return JSON.stringify({ weekdays });
      case "monthly":
        return JSON.stringify({ day_of_month: dayOfMonth });
      case "specific_dates":
        return JSON.stringify({ dates });
      default:
        return "{}";
    }
  }

  return (
    <form
      action={async (formData) => {
        formData.set("frequency_config", buildFrequencyConfig());
        await formAction(formData);
        onDone?.();
      }}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="session_id" className="block text-xs font-medium text-zinc-600">
            Session
          </label>
          <select
            id="session_id"
            name="session_id"
            defaultValue={medicine?.session_id ?? sessions[0]?.id ?? ""}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="time_to_take" className="block text-xs font-medium text-zinc-600">
            Time to take
          </label>
          <input
            id="time_to_take"
            name="time_to_take"
            type="time"
            defaultValue={medicine?.time_to_take?.slice(0, 5)}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-xs font-medium text-zinc-600">
          Medicine name (English)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={medicine?.name}
          required
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="dosage" className="block text-xs font-medium text-zinc-600">
            Dosage
          </label>
          <input
            id="dosage"
            name="dosage"
            type="number"
            step="0.5"
            min="0"
            defaultValue={medicine?.dosage ?? 1}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="dosage_unit" className="block text-xs font-medium text-zinc-600">
            Unit
          </label>
          <input
            id="dosage_unit"
            name="dosage_unit"
            type="text"
            placeholder="tablet, ml…"
            defaultValue={medicine?.dosage_unit}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="frequency_type" className="block text-xs font-medium text-zinc-600">
          Frequency
        </label>
        <select
          id="frequency_type"
          name="frequency_type"
          value={frequencyType}
          onChange={(e) => setFrequencyType(e.target.value as FrequencyType)}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="everyday">Everyday</option>
          <option value="alternate">Alternate days</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="specific_dates">Specific dates</option>
        </select>
      </div>

      <FrequencyFields
        frequencyType={frequencyType}
        anchorDate={anchorDate}
        setAnchorDate={setAnchorDate}
        weekdays={weekdays}
        setWeekdays={setWeekdays}
        dayOfMonth={dayOfMonth}
        setDayOfMonth={setDayOfMonth}
        dates={dates}
        setDates={setDates}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="stock_qty" className="block text-xs font-medium text-zinc-600">
            Stock quantity
          </label>
          <input
            id="stock_qty"
            name="stock_qty"
            type="number"
            step="0.5"
            min="0"
            defaultValue={medicine?.stock_qty ?? 0}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="low_stock_threshold" className="block text-xs font-medium text-zinc-600">
            Low stock threshold
          </label>
          <input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            step="0.5"
            min="0"
            defaultValue={medicine?.low_stock_threshold ?? 0}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="start_date" className="block text-xs font-medium text-zinc-600">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={medicine?.start_date ?? new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="end_date" className="block text-xs font-medium text-zinc-600">
            End date (optional)
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={medicine?.end_date ?? ""}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : medicine ? "Save changes" : "Add medicine"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
