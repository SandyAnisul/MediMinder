import { createClient } from "@/lib/supabase/server";
import type { Medicine, Session } from "@/lib/types/database";
import MedicineListItem from "./MedicineListItem";
import AddMedicineSection from "./AddMedicineSection";

export default async function MedicinesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: sessions }, { data: medicines, error }] = await Promise.all([
    supabase.from("sessions").select("id, patient_id, name, start_time, sort_order").eq("patient_id", id).order("sort_order"),
    supabase
      .from("medicines")
      .select(
        "id, patient_id, session_id, name, dosage, dosage_unit, time_to_take, frequency_type, frequency_config, stock_qty, low_stock_threshold, start_date, end_date, active, created_at",
      )
      .eq("patient_id", id)
      .order("time_to_take"),
  ]);

  const sessionList = (sessions ?? []) as Session[];
  const medicineList = (medicines ?? []) as Medicine[];

  if (sessionList.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Add at least one session in the Sessions tab before adding medicines.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {medicineList.length === 0 ? (
        <p className="text-sm text-zinc-500">No medicines yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {medicineList.map((medicine) => (
            <MedicineListItem key={medicine.id} patientId={id} medicine={medicine} sessions={sessionList} />
          ))}
        </ul>
      )}

      <AddMedicineSection patientId={id} sessions={sessionList} />
    </div>
  );
}
