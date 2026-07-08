"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/types/database";

export type PatientSettingsState = { error: string | null; saved?: boolean };

const VALID_LANGUAGES: Language[] = ["en", "hi", "mr"];

export async function updatePatientSettings(
  patientId: string,
  _prevState: PatientSettingsState,
  formData: FormData,
): Promise<PatientSettingsState> {
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const language = String(formData.get("language") ?? "");
  const escalationMinutes = Number(formData.get("escalation_minutes") ?? 20);
  const retryCount = Number(formData.get("retry_count") ?? 1);
  const active = formData.get("active") === "on";

  if (!name || !timezone || !VALID_LANGUAGES.includes(language as Language)) {
    return { error: "Name, timezone, and a valid language are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({
      name,
      timezone,
      language,
      escalation_minutes: escalationMinutes,
      retry_count: retryCount,
      active,
    })
    .eq("id", patientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/patients/${patientId}/settings`);
  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/patients");
  return { error: null, saved: true };
}
