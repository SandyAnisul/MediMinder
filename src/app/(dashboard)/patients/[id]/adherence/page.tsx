import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DoseStatus } from "@/lib/types/database";

const STATUSES: DoseStatus[] = ["pending", "reminded", "retried", "taken", "skipped", "missed"];

const STATUS_STYLES: Record<DoseStatus, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  reminded: "bg-blue-100 text-blue-700",
  retried: "bg-amber-100 text-amber-800",
  taken: "bg-green-100 text-green-700",
  skipped: "bg-zinc-100 text-zinc-600",
  missed: "bg-red-100 text-red-700",
};

interface DoseEventRow {
  id: string;
  scheduled_at: string;
  status: DoseStatus;
  confirmed_by: string | null;
  medicines: { name: string } | { name: string }[] | null;
}

export default async function AdherenceLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("dose_events")
    .select("id, scheduled_at, status, confirmed_by, medicines(name)")
    .eq("patient_id", id)
    .order("scheduled_at", { ascending: false })
    .limit(200);

  if (status && STATUSES.includes(status as DoseStatus)) {
    query = query.eq("status", status);
  }

  const { data: doseEvents, error } = await query;
  const rows = (doseEvents ?? []) as unknown as DoseEventRow[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/patients/${id}/adherence`}
          className={`rounded-full px-3 py-1 text-xs font-medium ${!status ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/patients/${id}/adherence?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${status === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No dose history yet — this fills in once the cron tick is running.
        </p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Medicine</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Confirmed by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => {
              const medicineName = Array.isArray(row.medicines)
                ? row.medicines[0]?.name
                : row.medicines?.name;
              return (
                <tr key={row.id}>
                  <td className="px-4 py-2 text-zinc-700">
                    {new Date(row.scheduled_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-zinc-900">{medicineName ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{row.confirmed_by ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
