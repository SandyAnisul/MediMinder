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
        <button
          disabled
          title="Add patient — coming in the next build step"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-50"
        >
          Add patient
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!error && patients?.length === 0 && (
        <p className="text-sm text-zinc-500">No patients yet.</p>
      )}

      {patients && patients.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {patients.map((patient) => (
            <li key={patient.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-base text-zinc-900">{patient.name}</span>
              <span className="text-sm text-zinc-500">
                {patient.active ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
