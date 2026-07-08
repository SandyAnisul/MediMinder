import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: patients, error } = await supabase
    .from("patients")
    .select("id, name, active, language, timezone")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Patients</h1>
        <Link
          href="/patients/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add patient
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!error && patients?.length === 0 && (
        <p className="text-sm text-zinc-500">No patients yet.</p>
      )}

      {patients && patients.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link
                href={`/patients/${patient.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
              >
                <span className="text-base text-zinc-900">{patient.name}</span>
                <span className="text-sm text-zinc-500">
                  {patient.active ? "Active" : "Inactive"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
