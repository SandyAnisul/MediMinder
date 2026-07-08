"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SessionFormState = { error: string | null };

export async function createSession(
  patientId: string,
  _prevState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name || !startTime) {
    return { error: "Name and start time are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .insert({ patient_id: patientId, name, start_time: startTime, sort_order: sortOrder });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/patients/${patientId}/sessions`);
  return { error: null };
}

export async function updateSession(
  patientId: string,
  sessionId: string,
  _prevState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name || !startTime) {
    return { error: "Name and start time are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ name, start_time: startTime, sort_order: sortOrder })
    .eq("id", sessionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/patients/${patientId}/sessions`);
  return { error: null };
}

export async function deleteSession(patientId: string, sessionId: string) {
  const supabase = await createClient();
  await supabase.from("sessions").delete().eq("id", sessionId);
  revalidatePath(`/patients/${patientId}/sessions`);
}
