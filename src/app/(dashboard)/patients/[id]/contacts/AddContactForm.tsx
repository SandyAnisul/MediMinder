"use client";

import { useActionState, useRef } from "react";
import { createContact, type ContactFormState } from "./actions";

const initialState: ContactFormState = { error: null };

export default function AddContactForm({ patientId }: { patientId: string }) {
  const boundCreate = createContact.bind(null, patientId);
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
        <label className="block text-xs font-medium text-zinc-600">Role</label>
        <select name="role" defaultValue="caregiver" className="rounded-md border border-zinc-300 px-2 py-1 text-sm">
          <option value="patient">Patient</option>
          <option value="caregiver">Caregiver</option>
          <option value="supervisor">Supervisor</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Name</label>
        <input name="name" type="text" required className="rounded-md border border-zinc-300 px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-600">Phone (optional)</label>
        <input name="phone" type="text" className="rounded-md border border-zinc-300 px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add contact"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
