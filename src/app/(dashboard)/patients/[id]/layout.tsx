import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PatientTabs from "./PatientTabs";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!patient) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Link href="/patients" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Patients
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">{patient.name}</h1>
      </div>

      <PatientTabs patientId={id} />

      {children}
    </div>
  );
}
