"use client";

import { useActionState, useRef } from "react";
import { createSession, type SessionFormState } from "./actions";

const initialState: SessionFormState = { error: null };

export default function AddSessionForm({ patientId, nextOrder }: { patientId: string; nextOrder: number }) {
  const boundCreate = createSession.bind(null, patientId);
  const [state, formAction, pending] = useActionState(boundCreate, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Name</label>
        <input
          name="name"
          type="text"
          placeholder="e.g. Before Breakfast"
          required
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Start time</label>
        <input name="start_time" type="time" required className="rounded-md border border-zinc-300 px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Order</label>
        <input
          name="sort_order"
          type="number"
          defaultValue={nextOrder}
          className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add session"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
