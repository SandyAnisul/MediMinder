import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram/api";
import { getDictionary, type Language } from "@/lib/i18n";
import { formatTimeInTimezone } from "@/lib/utils/timezone";
import type { DoseAction } from "@/lib/telegram/callbackData";

type AdminClient = ReturnType<typeof createAdminClient>;

interface JoinedDoseEvent {
  id: string;
  status: string;
  dose_deducted: boolean;
  medicine_id: string;
  patient_id: string;
  medicines: MedicineJoin | MedicineJoin[] | null;
  patients: PatientJoin | PatientJoin[] | null;
}

interface MedicineJoin {
  name: string;
  dosage: number;
  dosage_unit: string;
  stock_qty: number;
  low_stock_threshold: number;
}

interface PatientJoin {
  name: string;
  timezone: string;
  language: Language;
}

function unwrap<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export interface ConfirmDoseResult {
  ok: boolean;
  alreadyHandled?: boolean;
  message: string;
}

export async function confirmDose(
  supabase: AdminClient,
  doseEventId: string,
  action: DoseAction,
  confirmedBy: "patient" | "caregiver",
): Promise<ConfirmDoseResult> {
  const { data } = await supabase
    .from("dose_events")
    .select(
      "id, status, dose_deducted, medicine_id, patient_id, medicines(name, dosage, dosage_unit, stock_qty, low_stock_threshold), patients(name, timezone, language)",
    )
    .eq("id", doseEventId)
    .single();

  const doseEvent = data as unknown as JoinedDoseEvent | null;

  if (!doseEvent) {
    return { ok: false, message: "Dose not found" };
  }

  if (["taken", "skipped", "missed"].includes(doseEvent.status)) {
    return { ok: true, alreadyHandled: true, message: "Already recorded — no action taken" };
  }

  const medicine = unwrap(doseEvent.medicines);
  const patient = unwrap(doseEvent.patients);
  const now = new Date();
  const newStatus = action === "taken" ? "taken" : "skipped";

  const update: Record<string, unknown> = {
    status: newStatus,
    confirmed_at: now.toISOString(),
    confirmed_by: confirmedBy,
  };

  let lowStock = false;
  let newStockQty: number | null = null;

  if (action === "taken" && !doseEvent.dose_deducted && medicine) {
    newStockQty = medicine.stock_qty - medicine.dosage;
    await supabase.from("medicines").update({ stock_qty: newStockQty }).eq("id", doseEvent.medicine_id);
    update.dose_deducted = true;
    lowStock = newStockQty <= medicine.low_stock_threshold;
  }

  await supabase.from("dose_events").update(update).eq("id", doseEventId);

  if (lowStock && medicine && patient && newStockQty !== null) {
    await notifyLowStock(supabase, doseEvent.patient_id, patient, medicine, newStockQty);
  }

  const timeStr = formatTimeInTimezone(now, patient?.timezone ?? "Asia/Kolkata");
  const emoji = action === "taken" ? "✅" : "⏭️";
  const label = action === "taken" ? "taken" : "skipped";
  return { ok: true, message: `${emoji} Marked as ${label} at ${timeStr}` };
}

async function notifyLowStock(
  supabase: AdminClient,
  patientId: string,
  patient: PatientJoin,
  medicine: MedicineJoin,
  stockQty: number,
): Promise<void> {
  const dict = getDictionary(patient.language);
  const { data: contacts } = await supabase
    .from("contacts")
    .select("telegram_chat_id")
    .eq("patient_id", patientId)
    .eq("role", "caregiver")
    .not("telegram_chat_id", "is", null);

  const text = dict.lowStock(
    medicine.name,
    patient.name,
    String(stockQty),
    String(medicine.low_stock_threshold),
  );

  for (const contact of (contacts ?? []) as { telegram_chat_id: number | null }[]) {
    if (contact.telegram_chat_id) {
      await sendMessage(contact.telegram_chat_id, text);
    }
  }
}
