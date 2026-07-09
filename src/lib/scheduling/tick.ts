import { createAdminClient } from "@/lib/supabase/admin";
import { materializeDosesForPatient } from "./materializeDoses";
import { sendDueReminders, sendRetries, sendEscalations, type PatientForTick } from "./processDoses";
import { sendDailyScheduleIfDue } from "./dailyScheduleSend";
import { sendWeeklyReportIfDue } from "./weeklyReport";

type AdminClient = ReturnType<typeof createAdminClient>;

interface AppDefaults {
  escalation_minutes: number;
  retry_count: number;
  daily_schedule_time: string;
}

const FALLBACK_DEFAULTS: AppDefaults = {
  escalation_minutes: 20,
  retry_count: 1,
  daily_schedule_time: "07:00",
};

async function getAppDefaults(supabase: AdminClient): Promise<AppDefaults> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "defaults").single();
  if (!data?.value) return FALLBACK_DEFAULTS;
  return { ...FALLBACK_DEFAULTS, ...(data.value as Partial<AppDefaults>) };
}

export async function runCronTick(): Promise<{ patientsProcessed: number }> {
  const supabase = createAdminClient();
  const defaults = await getAppDefaults(supabase);

  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, language, timezone, escalation_minutes")
    .eq("active", true);

  const patientList = (patients ?? []) as PatientForTick[];

  for (const patient of patientList) {
    await materializeDosesForPatient(supabase, patient.id, patient.timezone);
    await sendDueReminders(supabase, patient);
    await sendRetries(supabase, patient);
    await sendEscalations(supabase, patient);
    await sendDailyScheduleIfDue(supabase, patient, defaults.daily_schedule_time);
    await sendWeeklyReportIfDue(supabase, patient, defaults.daily_schedule_time);
  }

  return { patientsProcessed: patientList.length };
}
