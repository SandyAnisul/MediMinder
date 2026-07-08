import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/types/database";
import SessionRow from "./SessionRow";
import AddSessionForm from "./AddSessionForm";

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, patient_id, name, start_time, sort_order")
    .eq("patient_id", id)
    .order("sort_order");

  const sessionList = (sessions ?? []) as Session[];
  const nextOrder = sessionList.length > 0 ? Math.max(...sessionList.map((s) => s.sort_order)) + 1 : 0;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {sessionList.length === 0 ? (
        <p className="text-sm text-zinc-500">No sessions yet — add the parts of the day below.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {sessionList.map((session) => (
            <SessionRow key={session.id} patientId={id} session={session} />
          ))}
        </ul>
      )}

      <AddSessionForm patientId={id} nextOrder={nextOrder} />
    </div>
  );
}
