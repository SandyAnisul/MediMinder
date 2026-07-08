"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContactRole } from "@/lib/types/database";

export type ContactFormState = { error: string | null };

const VALID_ROLES: ContactRole[] = ["patient", "caregiver", "supervisor", "doctor"];

export async function createContact(
  patientId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const role = String(formData.get("role") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !VALID_ROLES.includes(role as ContactRole)) {
    return { error: "Name and a valid role are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .insert({ patient_id: patientId, role, name, phone: phone || null });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/patients/${patientId}/contacts`);
  return { error: null };
}

export async function updateContact(
  patientId: string,
  contactId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const role = String(formData.get("role") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !VALID_ROLES.includes(role as ContactRole)) {
    return { error: "Name and a valid role are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ role, name, phone: phone || null })
    .eq("id", contactId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/patients/${patientId}/contacts`);
  return { error: null };
}

export async function deleteContact(patientId: string, contactId: string) {
  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", contactId);
  revalidatePath(`/patients/${patientId}/contacts`);
}
