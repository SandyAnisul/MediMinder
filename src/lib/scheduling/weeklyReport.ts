import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram/api";
import { getDictionary } from "@/lib/i18n";
import { getLinkedContacts } from "./contacts";
import {
  currentTimeInTimezone,
  dayOfWeekForDate,
  todayInTimezone,
  zonedTimeToUtc,
} from "@/lib/utils/timezone";
import type { PatientForTick } from "./processDoses";
import type { DoseStatus } from "@/lib/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

const WEEKLY_REPORT_WEEKDAY = 1; // Monday

async function alreadySentThisWeek(
  supabase: AdminClient,
  patientId: string,
  startOfDayUtc: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications")
    .select("id, contacts!inner(patient_id)")
    .eq("type", "weekly_report")
    .eq("contacts.patient_id", patientId)
    .gte("sent_at", startOfDayUtc)
    .limit(1);

  return (data ?? []).length > 0;
}

/** Step 6: weekly taken/missed/skipped summary to the doctor, sent Monday mornings. */
export async function sendWeeklyReportIfDue(
  supabase: AdminClient,
  patient: PatientForTick,
  dailyScheduleTime: string,
): Promise<void> {
  const todayStr = todayInTimezone(patient.timezone);
  if (dayOfWeekForDate(todayStr) !== WEEKLY_REPORT_WEEKDAY) return;

  const currentTime = currentTimeInTimezone(patient.timezone);
  if (currentTime < dailyScheduleTime) return;

  const startOfDayUtc = zonedTimeToUtc(todayStr, "00:00", patient.timezone).toISOString();
  if (await alreadySentThisWeek(supabase, patient.id, startOfDayUtc)) return;

  const doctors = await getLinkedContacts(supabase, patient.id, ["doctor"]);
  if (doctors.length === 0) return;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: doseEvents } = await supabase
    .from("dose_events")
    .select("status")
    .eq("patient_id", patient.id)
    .gte("scheduled_at", weekAgo.toISOString())
    .lte("scheduled_at", now.toISOString());

  const statuses = (doseEvents ?? []) as { status: DoseStatus }[];
  const taken = statuses.filter((d) => d.status === "taken").length;
  const missed = statuses.filter((d) => d.status === "missed").length;
  const skipped = statuses.filter((d) => d.status === "skipped").length;
  const total = statuses.length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  const dateRange = `${weekAgo.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)}`;
  const dict = getDictionary(patient.language);
  const text = dict.weeklyReport(patient.name, dateRange, taken, total, pct, missed, skipped);

  for (const contact of doctors) {
    const result = await sendMessage(contact.telegram_chat_id, text);
    await supabase.from("notifications").insert({
      contact_id: contact.id,
      type: "weekly_report",
      telegram_message_id: result.result?.message_id ?? null,
    });
  }
}
