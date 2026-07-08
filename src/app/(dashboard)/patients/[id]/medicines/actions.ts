"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FrequencyConfig, FrequencyType } from "@/lib/types/database";

export type MedicineFormState = { error: string | null };

const VALID_FREQUENCIES: FrequencyType[] = [
  "everyday",
  "alternate",
  "weekly",
  "monthly",
  "specific_dates",
];

interface ParsedMedicineFields {
  session_id: string;
  name: string;
  dosage: number;
  dosage_unit: string;
  time_to_take: string;
  frequency_type: string;
  frequency_config: FrequencyConfig;
  stock_qty: number;
  low_stock_threshold: number;
  start_date: string;
  end_date: string | null;
}

type ParseResult =
  | { ok: true; fields: ParsedMedicineFields }
  | { ok: false; error: string };

function parseMedicineFields(formData: FormData): ParseResult {
  const sessionId = String(formData.get("session_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const dosage = Number(formData.get("dosage") ?? 0);
  const dosageUnit = String(formData.get("dosage_unit") ?? "").trim();
  const timeToTake = String(formData.get("time_to_take") ?? "");
  const frequencyType = String(formData.get("frequency_type") ?? "");
  const frequencyConfigRaw = String(formData.get("frequency_config") ?? "{}");
  const stockQty = Number(formData.get("stock_qty") ?? 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 0);
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!sessionId || !name || !dosageUnit || !timeToTake || !startDate) {
    return { ok: false, error: "Session, name, unit, time, and start date are required" };
  }

  if (!VALID_FREQUENCIES.includes(frequencyType as FrequencyType)) {
    return { ok: false, error: "Invalid frequency type" };
  }

  let frequencyConfig: FrequencyConfig;
  try {
    frequencyConfig = JSON.parse(frequencyConfigRaw) as FrequencyConfig;
  } catch {
    return { ok: false, error: "Invalid frequency config" };
  }

  return {
    ok: true,
    fields: {
      session_id: sessionId,
      name,
      dosage,
      dosage_unit: dosageUnit,
      time_to_take: timeToTake,
      frequency_type: frequencyType,
      frequency_config: frequencyConfig,
      stock_qty: stockQty,
      low_stock_threshold: lowStockThreshold,
      start_date: startDate,
      end_date: endDate || null,
    },
  };
}

export async function createMedicine(
  patientId: string,
  _prevState: MedicineFormState,
  formData: FormData,
): Promise<MedicineFormState> {
  const parsed = parseMedicineFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("medicines")
    .insert({ patient_id: patientId, ...parsed.fields });

  if (error) return { error: error.message };

  revalidatePath(`/patients/${patientId}/medicines`);
  return { error: null };
}

export async function updateMedicine(
  patientId: string,
  medicineId: string,
  _prevState: MedicineFormState,
  formData: FormData,
): Promise<MedicineFormState> {
  const parsed = parseMedicineFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("medicines").update(parsed.fields).eq("id", medicineId);

  if (error) return { error: error.message };

  revalidatePath(`/patients/${patientId}/medicines`);
  return { error: null };
}

export async function deleteMedicine(patientId: string, medicineId: string) {
  const supabase = await createClient();
  await supabase.from("medicines").delete().eq("id", medicineId);
  revalidatePath(`/patients/${patientId}/medicines`);
}

export async function toggleMedicineActive(patientId: string, medicineId: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("medicines").update({ active }).eq("id", medicineId);
  revalidatePath(`/patients/${patientId}/medicines`);
}
