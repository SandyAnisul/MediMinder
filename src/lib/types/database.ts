export type Language = "en" | "hi" | "mr";

export type ContactRole = "patient" | "caregiver" | "supervisor" | "doctor";

export type FrequencyType = "everyday" | "alternate" | "weekly" | "monthly" | "specific_dates";

export type FrequencyConfig =
  | Record<string, never>
  | { anchor_date: string }
  | { weekdays: number[] }
  | { day_of_month: number }
  | { dates: string[] };

export type DoseStatus = "pending" | "reminded" | "retried" | "taken" | "skipped" | "missed";

export interface Patient {
  id: string;
  admin_id: string;
  name: string;
  timezone: string;
  language: Language;
  escalation_minutes: number;
  retry_count: number;
  active: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  patient_id: string;
  role: ContactRole;
  name: string;
  phone: string | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  link_code: string;
  linked_at: string | null;
  active: boolean;
}

export interface Session {
  id: string;
  patient_id: string;
  name: string;
  start_time: string;
  sort_order: number;
}

export interface Medicine {
  id: string;
  patient_id: string;
  session_id: string;
  name: string;
  dosage: number;
  dosage_unit: string;
  time_to_take: string;
  frequency_type: FrequencyType;
  frequency_config: FrequencyConfig;
  stock_qty: number;
  low_stock_threshold: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

export interface DoseEvent {
  id: string;
  medicine_id: string;
  patient_id: string;
  session_id: string;
  scheduled_at: string;
  status: DoseStatus;
  reminder_sent_at: string | null;
  retry_sent_at: string | null;
  escalated_at: string | null;
  confirmed_at: string | null;
  confirmed_by: "patient" | "caregiver" | "auto" | null;
  dose_deducted: boolean;
  created_at: string;
}
