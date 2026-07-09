"use client";

import { useActionState } from "react";
import { createPatient, type CreatePatientState } from "./actions";

const initialState: CreatePatientState = { error: null };

export default function NewPatientForm() {
  const [state, formAction, pending] = useActionState(createPatient, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Patient name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
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
          defaultValue="Asia/Kolkata"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="language" className="block text-sm font-medium text-zinc-700">
          Language
        </label>
        <select
          id="language"
          name="language"
          defaultValue="en"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create patient"}
      </button>
    </form>
  );
}
