"use client";

import { useActionState } from "react";
import { updateDefaults, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = { error: null };

interface Defaults {
  escalation_minutes: number;
  retry_count: number;
  daily_schedule_time: string;
}

export default function DefaultsForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState(updateDefaults, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="space-y-1">
        <label htmlFor="escalation_minutes" className="block text-sm font-medium text-zinc-700">
          Escalation minutes
        </label>
        <input
          id="escalation_minutes"
          name="escalation_minutes"
          type="number"
          min={1}
          defaultValue={defaults.escalation_minutes}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="retry_count" className="block text-sm font-medium text-zinc-700">
          Retry count
        </label>
        <input
          id="retry_count"
          name="retry_count"
          type="number"
          min={0}
          defaultValue={defaults.retry_count}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="daily_schedule_time" className="block text-sm font-medium text-zinc-700">
          Daily schedule time
        </label>
        <input
          id="daily_schedule_time"
          name="daily_schedule_time"
          type="time"
          defaultValue={defaults.daily_schedule_time}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save defaults"}
      </button>
    </form>
  );
}
