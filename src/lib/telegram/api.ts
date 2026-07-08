import { encodeDoseCallback } from "./callbackData";
import type { Dictionary } from "@/lib/i18n/en";

const TELEGRAM_API = "https://api.telegram.org";

function botUrl(method: string): string {
  return `${TELEGRAM_API}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

interface TelegramApiResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export function buildDoseKeyboard(doseEventId: string, dict: Dictionary): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: dict.buttonTaken, callback_data: encodeDoseCallback(doseEventId, "taken") },
        { text: dict.buttonSkip, callback_data: encodeDoseCallback(doseEventId, "skip") },
      ],
    ],
  };
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<TelegramApiResult<{ message_id: number }>> {
  const res = await fetch(botUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
  });
  return res.json() as Promise<TelegramApiResult<{ message_id: number }>>;
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<TelegramApiResult<{ message_id: number }>> {
  const res = await fetch(botUrl("editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: replyMarkup ?? { inline_keyboard: [] },
    }),
  });
  return res.json() as Promise<TelegramApiResult<{ message_id: number }>>;
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await fetch(botUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function setWebhook(url: string, secretToken: string): Promise<TelegramApiResult<boolean>> {
  const res = await fetch(botUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secretToken }),
  });
  return res.json() as Promise<TelegramApiResult<boolean>>;
}
