import { createClient } from "@/lib/supabase/server";
import type { Medicine, Session } from "@/lib/types/database";

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: sessions }, { data: medicines }, { data: doseEvents }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, patient_id, name, start_time, sort_order")
      .eq("patient_id", id)
      .order("sort_order"),
    supabase
      .from("medicines")
      .select(
        "id, patient_id, session_id, name, dosage, dosage_unit, time_to_take, active, frequency_type, frequency_config, stock_qty, low_stock_threshold, start_date, end_date, created_at",
      )
      .eq("patient_id", id)
      .eq("active", true)
      .order("time_to_take"),
    supabase
      .from("dose_events")
      .select("status")
      .eq("patient_id", id)
      .gte("scheduled_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const sessionList = (sessions ?? []) as Session[];
  const medicineList = (medicines ?? []) as Medicine[];

  const taken = doseEvents?.filter((d) => d.status === "taken").length ?? 0;
  const missed = doseEvents?.filter((d) => d.status === "missed").length ?? 0;
  const skipped = doseEvents?.filter((d) => d.status === "skipped").length ?? 0;
  const total = doseEvents?.length ?? 0;
  const pct = total > 0 ? Math.round((taken / total) * 100) : null;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Adherence — last 7 days</h2>
        {total === 0 ? (
          <p className="text-sm text-zinc-500">
            No doses recorded yet — reminders start once the cron tick is running.
          </p>
        ) : (
          <p className="text-sm text-zinc-700">
            Taken {taken}/{total} ({pct}%) · Missed {missed} · Skipped {skipped}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Active medicines by session</h2>
        {sessionList.length === 0 ? (
          <p className="text-sm text-zinc-500">No sessions set up yet — add some in the Sessions tab.</p>
        ) : (
          <div className="space-y-4">
            {sessionList.map((session) => {
              const sessionMedicines = medicineList.filter((m) => m.session_id === session.id);
              return (
                <div key={session.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <h3 className="text-sm font-medium text-zinc-900">
                    {session.name} <span className="text-zinc-500">({session.start_time})</span>
                  </h3>
                  {sessionMedicines.length === 0 ? (
                    <p className="mt-1 text-sm text-zinc-500">No medicines</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {sessionMedicines.map((m) => (
                        <li key={m.id} className="text-sm text-zinc-700">
                          {m.name} — {m.dosage}
                          {m.dosage_unit} at {m.time_to_take}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
