import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactRole } from "@/lib/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface LinkedContact {
  id: string;
  telegram_chat_id: number;
  role: ContactRole;
}

export async function getLinkedContacts(
  supabase: AdminClient,
  patientId: string,
  roles: ContactRole[],
): Promise<LinkedContact[]> {
  const { data } = await supabase
    .from("contacts")
    .select("id, telegram_chat_id, role")
    .eq("patient_id", patientId)
    .eq("active", true)
    .in("role", roles)
    .not("telegram_chat_id", "is", null);

  return (data ?? []) as LinkedContact[];
}
