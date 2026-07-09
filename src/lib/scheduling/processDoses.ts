import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, buildDoseKeyboard } from "@/lib/telegram/api";
import { getDictionary, type Language } from "@/lib/i18n";
import { getLinkedContacts, type LinkedContact } from "./contacts";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface PatientForTick {
  id: string;
  name: string;
  language: Language;
  timezone: string;
  escalation_minutes: number;
}

interface MedicineJoin {
  name: string;
  dosage: number;
  dosage_unit: string;
}

interface SessionJoin {
  name: string;
}

interface DoseJoin {
  id: string;
  reminder_sent_at: string | null;
  retry_sent_at: string | null;
  medicines: MedicineJoin | MedicineJoin[] | null;
  sessions: SessionJoin | SessionJoin[] | null;
}

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function notifyContacts(
  supabase: AdminClient,
  contacts: LinkedContact[],
  text: string,
  doseEventId: string,
  notificationType: "reminder" | "retry" | "escalation",
  keyboard?: ReturnType<typeof buildDoseKeyboard>,
): Promise<void> {
  for (const contact of contacts) {
    const result = await sendMessage(contact.telegram_chat_id, text, keyboard);
    await supabase.from("notifications").insert({
      dose_event_id: doseEventId,
      contact_id: contact.id,
      type: notificationType,
      telegram_message_id: result.result?.message_id ?? null,
    });
  }
}

/** Step 2: send reminders for pending doses whose time has arrived. */
export async function sendDueReminders(supabase: AdminClient, patient: PatientForTick): Promise<void> {
  const now = new Date();
  const dict = getDictionary(patient.language);

  const { data } = await supabase
    .from("dose_events")
    .select("id, reminder_sent_at, retry_sent_at, medicines(name, dosage, dosage_unit), sessions(name)")
    .eq("patient_id", patient.id)
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString());

  const doses = (data ?? []) as unknown as DoseJoin[];
  if (doses.length === 0) return;

  const contacts = await getLinkedContacts(supabase, patient.id, ["patient", "caregiver"]);

  for (const dose of doses) {
    const medicine = unwrap(dose.medicines);
    const session = unwrap(dose.sessions);
    if (!medicine || !session) continue;

    const text = dict.reminder(medicine.name, `${medicine.dosage}${medicine.dosage_unit}`, session.name);
    const keyboard = buildDoseKeyboard(dose.id, dict);

    await notifyContacts(supabase, contacts, text, dose.id, "reminder", keyboard);
    await supabase
      .from("dose_events")
      .update({ status: "reminded", reminder_sent_at: now.toISOString() })
      .eq("id", dose.id);
  }
}

/** Step 3: resend once for reminded doses that timed out with no reply. */
export async function sendRetries(supabase: AdminClient, patient: PatientForTick): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - patient.escalation_minutes * 60000).toISOString();
  const dict = getDictionary(patient.language);

  const { data } = await supabase
    .from("dose_events")
    .select("id, reminder_sent_at, retry_sent_at, medicines(name, dosage, dosage_unit), sessions(name)")
    .eq("patient_id", patient.id)
    .eq("status", "reminded")
    .is("retry_sent_at", null)
    .lte("reminder_sent_at", cutoff);

  const doses = (data ?? []) as unknown as DoseJoin[];
  if (doses.length === 0) return;

  const contacts = await getLinkedContacts(supabase, patient.id, ["patient", "caregiver"]);

  for (const dose of doses) {
    const medicine = unwrap(dose.medicines);
    if (!medicine) continue;

    const text = dict.retry(medicine.name, `${medicine.dosage}${medicine.dosage_unit}`);
    const keyboard = buildDoseKeyboard(dose.id, dict);

    await notifyContacts(supabase, contacts, text, dose.id, "retry", keyboard);
    await supabase
      .from("dose_events")
      .update({ status: "retried", retry_sent_at: now.toISOString() })
      .eq("id", dose.id);
  }
}

/** Step 4: mark as missed and escalate to caregivers + supervisors. */
export async function sendEscalations(supabase: AdminClient, patient: PatientForTick): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - patient.escalation_minutes * 60000).toISOString();
  const dict = getDictionary(patient.language);

  const { data } = await supabase
    .from("dose_events")
    .select("id, scheduled_at, medicines(name, dosage, dosage_unit), sessions(name)")
    .eq("patient_id", patient.id)
    .eq("status", "retried")
    .lte("retry_sent_at", cutoff);

  const doses = (data ?? []) as unknown as (DoseJoin & { scheduled_at: string })[];
  if (doses.length === 0) return;

  const contacts = await getLinkedContacts(supabase, patient.id, ["caregiver", "supervisor"]);

  for (const dose of doses) {
    const medicine = unwrap(dose.medicines);
    if (!medicine) continue;

    await supabase
      .from("dose_events")
      .update({ status: "missed", escalated_at: now.toISOString() })
      .eq("id", dose.id);

    const timeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: patient.timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dose.scheduled_at));

    const text = dict.escalation(
      patient.name,
      medicine.name,
      `${medicine.dosage}${medicine.dosage_unit}`,
      timeStr,
    );

    await notifyContacts(supabase, contacts, text, dose.id, "escalation");
  }
}
