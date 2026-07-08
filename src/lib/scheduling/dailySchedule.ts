import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, type Language } from "@/lib/i18n";

type AdminClient = ReturnType<typeof createAdminClient>;

interface SessionRow {
  id: string;
  name: string;
  start_time: string;
}

interface MedicineRow {
  session_id: string;
  name: string;
  dosage: number;
  dosage_unit: string;
  time_to_take: string;
}

export async function buildDailyScheduleText(
  supabase: AdminClient,
  patientId: string,
  patientName: string,
  language: Language,
): Promise<string> {
  const dict = getDictionary(language);

  const [{ data: sessions }, { data: medicines }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, name, start_time")
      .eq("patient_id", patientId)
      .order("sort_order"),
    supabase
      .from("medicines")
      .select("session_id, name, dosage, dosage_unit, time_to_take")
      .eq("patient_id", patientId)
      .eq("active", true)
      .order("time_to_take"),
  ]);

  const sessionList = (sessions ?? []) as SessionRow[];
  const medicineList = (medicines ?? []) as MedicineRow[];

  const lines = [dict.dailySchedule(patientName)];

  for (const session of sessionList) {
    const sessionMedicines = medicineList.filter((m) => m.session_id === session.id);
    if (sessionMedicines.length === 0) continue;
    lines.push("");
    lines.push(`🕗 ${session.name} (${session.start_time.slice(0, 5)})`);
    for (const m of sessionMedicines) {
      lines.push(`• ${m.name} — ${m.dosage}${m.dosage_unit} at ${m.time_to_take.slice(0, 5)}`);
    }
  }

  return lines.join("\n");
}
