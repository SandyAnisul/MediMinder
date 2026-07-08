import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, editMessageText, answerCallbackQuery } from "@/lib/telegram/api";
import { decodeDoseCallback } from "@/lib/telegram/callbackData";
import { getDictionary, type Language } from "@/lib/i18n";
import { buildDailyScheduleText } from "@/lib/scheduling/dailySchedule";
import { confirmDose } from "@/lib/scheduling/confirmDose";
import type { TelegramCallbackQuery, TelegramMessage, TelegramUpdate } from "@/lib/telegram/types";

type AdminClient = ReturnType<typeof createAdminClient>;

interface LinkedContact {
  id: string;
  role: string;
  patient_id: string;
  patients: { id: string; name: string; language: Language } | { id: string; name: string; language: Language }[] | null;
}

function unwrap<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function findLinkedContact(supabase: AdminClient, chatId: number): Promise<LinkedContact | null> {
  const { data } = await supabase
    .from("contacts")
    .select("id, role, patient_id, patients(id, name, language)")
    .eq("telegram_chat_id", chatId)
    .eq("active", true)
    .maybeSingle();

  return data as unknown as LinkedContact | null;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const supabase = createAdminClient();

  if (update.message) {
    await handleMessage(supabase, update.message);
  } else if (update.callback_query) {
    await handleCallbackQuery(supabase, update.callback_query);
  }

  return NextResponse.json({ ok: true });
}

async function handleMessage(supabase: AdminClient, message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();

  if (text.startsWith("/start")) {
    const code = text.split(" ")[1]?.trim();
    if (!code) {
      await sendMessage(chatId, getDictionary("en").help);
      return;
    }
    await handleStart(supabase, chatId, code, message.from?.username);
    return;
  }

  const contact = await findLinkedContact(supabase, chatId);

  if (text === "/help") {
    const language = unwrap(contact?.patients ?? null)?.language ?? "en";
    await sendMessage(chatId, getDictionary(language).help);
    return;
  }

  if (text === "/today") {
    if (!contact) {
      await sendMessage(chatId, getDictionary("en").notLinked);
      return;
    }
    const patient = unwrap(contact.patients);
    if (!patient) return;
    const scheduleText = await buildDailyScheduleText(supabase, patient.id, patient.name, patient.language);
    await sendMessage(chatId, scheduleText);
    return;
  }
}

async function handleStart(
  supabase: AdminClient,
  chatId: number,
  code: string,
  username: string | undefined,
): Promise<void> {
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, role, patient_id, linked_at, patients(name, language)")
    .eq("link_code", code)
    .maybeSingle();

  if (!contact) {
    await sendMessage(chatId, getDictionary("en").invalidLinkCode);
    return;
  }

  const patient = unwrap(
    (contact as unknown as { patients: { name: string; language: Language } | { name: string; language: Language }[] | null }).patients,
  );

  if (!patient) {
    await sendMessage(chatId, getDictionary("en").invalidLinkCode);
    return;
  }

  await supabase
    .from("contacts")
    .update({ telegram_chat_id: chatId, telegram_username: username ?? null, linked_at: new Date().toISOString() })
    .eq("id", contact.id);

  const dict = getDictionary(patient.language);
  await sendMessage(chatId, dict.linked(contact.role, patient.name));
}

async function handleCallbackQuery(supabase: AdminClient, callbackQuery: TelegramCallbackQuery): Promise<void> {
  const data = callbackQuery.data;
  const message = callbackQuery.message;

  if (!data || !message) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  const decoded = decodeDoseCallback(data);
  if (!decoded) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  const contact = await findLinkedContact(supabase, message.chat.id);
  const confirmedBy = contact?.role === "patient" ? "patient" : "caregiver";

  const result = await confirmDose(supabase, decoded.doseEventId, decoded.action, confirmedBy);

  await answerCallbackQuery(callbackQuery.id, result.alreadyHandled ? result.message : undefined);
  await editMessageText(message.chat.id, message.message_id, result.message);
}
