import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types/database";
import ContactRow from "./ContactRow";
import AddContactForm from "./AddContactForm";

export default async function ContactsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, patient_id, role, name, phone, telegram_chat_id, telegram_username, link_code, linked_at, active")
    .eq("patient_id", id)
    .order("role");

  const contactList = (contacts ?? []) as Contact[];
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!botUsername && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME in .env.local to generate invite links.
        </p>
      )}

      {contactList.length === 0 ? (
        <p className="text-sm text-zinc-500">No contacts yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {contactList.map((contact) => (
            <ContactRow key={contact.id} patientId={id} contact={contact} botUsername={botUsername} />
          ))}
        </ul>
      )}

      <AddContactForm patientId={id} />
    </div>
  );
}
