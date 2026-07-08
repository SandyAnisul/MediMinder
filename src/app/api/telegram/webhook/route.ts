import { NextRequest, NextResponse } from "next/server";

// POST /api/telegram/webhook — Telegram calls this on every message/callback.
// Verifies X-Telegram-Bot-Api-Secret-Token against TELEGRAM_WEBHOOK_SECRET.
// Linking, /help, /today, and Taken/Skip callback handling land in Part D Step 5.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await request.json();

  return NextResponse.json({ ok: true });
}
