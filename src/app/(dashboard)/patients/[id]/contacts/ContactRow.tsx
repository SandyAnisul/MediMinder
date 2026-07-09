"use client";

import { useActionState, useState } from "react";
import type { Contact, ContactRole } from "@/lib/types/database";
import { updateContact, deleteContact, type ContactFormState } from "./actions";

const initialState: ContactFormState = { error: null };

const ROLE_LABELS: Record<ContactRole, string> = {
  patient: "Patient",
  caregiver: "Caregiver",
  supervisor: "Supervisor",
  doctor: "Doctor",
};

export default function ContactRow({
  patientId,
  contact,
  botUsername,
}: {
  patientId: string;
  contact: Contact;
  botUsername: string | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const boundUpdate = updateContact.bind(null, patientId, contact.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initialState);

  const inviteLink = botUsername ? `https://t.me/${botUsername}?start=${contact.link_code}` : null;

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base text-zinc-900">{contact.name}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {ROLE_LABELS[contact.role]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {contact.linked_at ? `Linked ${new Date(contact.linked_at).toLocaleDateString()}` : "Not linked"}
            {contact.phone ? ` · ${contact.phone}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {!contact.linked_at && inviteLink && (
            <button
              type="button"
              onClick={copyLink}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              {copied ? "Copied!" : "Copy invite link"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Edit
          </button>
          <form action={deleteContact.bind(null, patientId, contact.id)}>
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
          <label htmlFor={`role-${contact.id}`} className="block text-xs font-medium text-zinc-600">
            Role
          </label>
          <select
            id={`role-${contact.id}`}
            name="role"
            defaultValue={contact.role}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          >
            <option value="patient">Patient</option>
            <option value="caregiver">Caregiver</option>
            <option value="supervisor">Supervisor</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor={`name-${contact.id}`} className="block text-xs font-medium text-zinc-600">
            Name
          </label>
          <input
            id={`name-${contact.id}`}
            name="name"
            type="text"
            defaultValue={contact.name}
            required
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`phone-${contact.id}`} className="block text-xs font-medium text-zinc-600">
            Phone
          </label>
          <input
            id={`phone-${contact.id}`}
            name="phone"
            type="text"
            defaultValue={contact.phone ?? ""}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
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
