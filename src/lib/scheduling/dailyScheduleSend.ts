import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram/api";
import { buildDailyScheduleText } from "./dailySchedule";
import { getLinkedContacts } from "./contacts";
import { currentTimeInTimezone, todayInTimezone, zonedTimeToUtc } from "@/lib/utils/timezone";
import type { PatientForTick } from "./processDoses";

type AdminClient = ReturnType<typeof createAdminClient>;

async function alreadySentToday(
  supabase: AdminClient,
  patientId: string,
  type: "daily_schedule" | "weekly_report",
  startOfDayUtc: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications")
    .select("id, contacts!inner(patient_id)")
    .eq("type", type)
    .eq("contacts.patient_id", patientId)
    .gte("sent_at", startOfDayUtc)
    .limit(1);

  return (data ?? []).length > 0;
}

/** Step 5: once per patient per day, at or after their configured daily schedule time. */
export async function sendDailyScheduleIfDue(
  supabase: AdminClient,
  patient: PatientForTick,
  dailyScheduleTime: string,
): Promise<void> {
  const currentTime = currentTimeInTimezone(patient.timezone);
  if (currentTime < dailyScheduleTime) return;

  const todayStr = todayInTimezone(patient.timezone);
  const startOfDayUtc = zonedTimeToUtc(todayStr, "00:00", patient.timezone).toISOString();

  if (await alreadySentToday(supabase, patient.id, "daily_schedule", startOfDayUtc)) return;

  const contacts = await getLinkedContacts(supabase, patient.id, ["patient", "caregiver"]);
  if (contacts.length === 0) return;

  const text = await buildDailyScheduleText(supabase, patient.id, patient.name, patient.language);

  for (const contact of contacts) {
    const result = await sendMessage(contact.telegram_chat_id, text);
    await supabase.from("notifications").insert({
      contact_id: contact.id,
      type: "daily_schedule",
      telegram_message_id: result.result?.message_id ?? null,
    });
  }
}
