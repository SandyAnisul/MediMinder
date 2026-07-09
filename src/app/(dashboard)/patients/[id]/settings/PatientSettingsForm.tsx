"use client";

import { useActionState } from "react";
import type { Patient } from "@/lib/types/database";
import { updatePatientSettings, type PatientSettingsState } from "./actions";

const initialState: PatientSettingsState = { error: null };

export default function PatientSettingsForm({ patient }: { patient: Patient }) {
  const boundAction = updatePatientSettings.bind(null, patient.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={patient.name}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="timezone" className="block text-sm font-medium text-zinc-700">
          Time zone
        </label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          defaultValue={patient.timezone}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="language" className="block text-sm font-medium text-zinc-700">
          Language
        </label>
        <select
          id="language"
          name="language"
          defaultValue={patient.language}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="escalation_minutes" className="block text-sm font-medium text-zinc-700">
            Escalation (minutes)
          </label>
          <input
            id="escalation_minutes"
            name="escalation_minutes"
            type="number"
            min={1}
            defaultValue={patient.escalation_minutes}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="retry_count" className="block text-sm font-medium text-zinc-700">
            Retries
          </label>
          <input
            id="retry_count"
            name="retry_count"
            type="number"
            min={0}
            defaultValue={patient.retry_count}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input name="active" type="checkbox" defaultChecked={patient.active} />
        Active
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-green-700">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
