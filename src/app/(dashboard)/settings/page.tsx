import { createClient } from "@/lib/supabase/server";
import DefaultsForm from "./DefaultsForm";
import ChangePasswordForm from "./ChangePasswordForm";

interface Defaults {
  escalation_minutes: number;
  retry_count: number;
  daily_schedule_time: string;
}

const FALLBACK_DEFAULTS: Defaults = {
  escalation_minutes: 20,
  retry_count: 1,
  daily_schedule_time: "07:00",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "defaults").single();
  const defaults = { ...FALLBACK_DEFAULTS, ...(data?.value as Partial<Defaults> | undefined) };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">Global defaults and account settings.</p>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Global defaults</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Used for new patients and as the daily schedule / weekly report timing across all patients.
        </p>
        <DefaultsForm defaults={defaults} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Change password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
