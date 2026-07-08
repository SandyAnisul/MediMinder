"use client";

import { useState } from "react";
import type { Medicine, Session } from "@/lib/types/database";
import { deleteMedicine, toggleMedicineActive } from "./actions";
import MedicineForm from "./MedicineForm";

const FREQUENCY_LABELS: Record<Medicine["frequency_type"], string> = {
  everyday: "Everyday",
  alternate: "Alternate days",
  weekly: "Weekly",
  monthly: "Monthly",
  specific_dates: "Specific dates",
};

export default function MedicineListItem({
  patientId,
  medicine,
  sessions,
}: {
  patientId: string;
  medicine: Medicine;
  sessions: Session[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="p-4">
        <MedicineForm
          patientId={patientId}
          sessions={sessions}
          medicine={medicine}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  const lowStock = medicine.stock_qty <= medicine.low_stock_threshold;

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-base text-zinc-900">{medicine.name}</span>
          {!medicine.active && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Inactive</span>
          )}
          {lowStock && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Low stock</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">
          {medicine.dosage}
          {medicine.dosage_unit} at {medicine.time_to_take} · {FREQUENCY_LABELS[medicine.frequency_type]} ·
          Stock {medicine.stock_qty} (threshold {medicine.low_stock_threshold})
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Edit
        </button>
        <form action={toggleMedicineActive.bind(null, patientId, medicine.id, !medicine.active)}>
          <button type="submit" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            {medicine.active ? "Deactivate" : "Activate"}
          </button>
        </form>
        <form action={deleteMedicine.bind(null, patientId, medicine.id)}>
          <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
