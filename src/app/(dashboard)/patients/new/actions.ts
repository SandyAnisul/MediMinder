"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreatePatientState = { error: string | null };

export async function createPatient(
  _prevState: CreatePatientState,
  formData: FormData,
): Promise<CreatePatientState> {
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Kolkata").trim();
  const language = String(formData.get("language") ?? "en");

  if (!name) {
    return { error: "Name is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in" };
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({ admin_id: user.id, name, timezone, language })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/patients/${data.id}`);
}
