import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/lib/types/database";
import PatientSettingsForm from "./PatientSettingsForm";

export default async function PatientSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, admin_id, name, timezone, language, escalation_minutes, retry_count, active, created_at")
    .eq("id", id)
    .single();

  if (!patient) {
    notFound();
  }

  return <PatientSettingsForm patient={patient as Patient} />;
}
