"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState = { error: string | null; success?: boolean };

export async function updateDefaults(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const escalationMinutes = Number(formData.get("escalation_minutes"));
  const retryCount = Number(formData.get("retry_count"));
  const dailyScheduleTime = String(formData.get("daily_schedule_time") ?? "");

  if (!escalationMinutes || escalationMinutes < 1 || !dailyScheduleTime) {
    return { error: "Please fill in valid values" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      value: {
        escalation_minutes: escalationMinutes,
        retry_count: retryCount,
        daily_schedule_time: dailyScheduleTime,
      },
    })
    .eq("key", "defaults");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function changePassword(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { error: null, success: true };
}
