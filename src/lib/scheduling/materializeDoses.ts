import { createAdminClient } from "@/lib/supabase/admin";
import type { Medicine } from "@/lib/types/database";
import { isDueToday } from "./frequency";
import { todayInTimezone, zonedTimeToUtc } from "@/lib/utils/timezone";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Ensures a pending dose_events row exists for every active medicine that is
 * due today for this patient. Idempotent via the unique index on
 * (medicine_id, scheduled_at) — safe to call every tick.
 */
export async function materializeDosesForPatient(
  supabase: AdminClient,
  patientId: string,
  timezone: string,
): Promise<void> {
  const todayStr = todayInTimezone(timezone);

  const { data: medicines } = await supabase
    .from("medicines")
    .select(
      "id, patient_id, session_id, time_to_take, frequency_type, frequency_config, start_date, end_date",
    )
    .eq("patient_id", patientId)
    .eq("active", true);

  const dueMedicines = ((medicines ?? []) as Medicine[]).filter((medicine) =>
    isDueToday(
      medicine.frequency_type,
      medicine.frequency_config,
      medicine.start_date,
      medicine.end_date,
      todayStr,
    ),
  );

  if (dueMedicines.length === 0) return;

  const rows = dueMedicines.map((medicine) => ({
    medicine_id: medicine.id,
    patient_id: patientId,
    session_id: medicine.session_id,
    scheduled_at: zonedTimeToUtc(todayStr, medicine.time_to_take.slice(0, 5), timezone).toISOString(),
    status: "pending" as const,
  }));

  await supabase.from("dose_events").upsert(rows, {
    onConflict: "medicine_id,scheduled_at",
    ignoreDuplicates: true,
  });
}
