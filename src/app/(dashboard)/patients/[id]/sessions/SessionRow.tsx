"use client";

import { useActionState, useState } from "react";
import type { Session } from "@/lib/types/database";
import { updateSession, deleteSession, type SessionFormState } from "./actions";

const initialState: SessionFormState = { error: null };

export default function SessionRow({ patientId, session }: { patientId: string; session: Session }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateSession.bind(null, patientId, session.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initialState);

  if (!editing) {
    return (
      <li className="flex items-center justify-between px-4 py-3">
        <span className="text-base text-zinc-900">
          {session.name} <span className="text-zinc-400">({session.start_time})</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Edit
          </button>
          <form action={deleteSession.bind(null, patientId, session.id)}>
            <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
              Delete
            </button>
          </form>
        </div>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      <form
        action={async (formData) => {
          await formAction(formData);
          setEditing(false);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-600">Name</label>
          <input
            name="name"
            type="text"
            defaultValue={session.name}
            required
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-600">Start time</label>
          <input
            name="start_time"
            type="time"
            defaultValue={session.start_time.slice(0, 5)}
            required
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-600">Order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={session.sort_order}
            className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </button>
        {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      </form>
    </li>
  );
}
