"use client";

import { useState } from "react";
import type { Session } from "@/lib/types/database";
import MedicineForm from "./MedicineForm";

export default function AddMedicineSection({
  patientId,
  sessions,
}: {
  patientId: string;
  sessions: Session[];
}) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return <MedicineForm patientId={patientId} sessions={sessions} onDone={() => setAdding(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
    >
      Add medicine
    </button>
  );
}
