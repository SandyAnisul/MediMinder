import { NextRequest, NextResponse } from "next/server";
import { runCronTick } from "@/lib/scheduling/tick";

// GET /api/cron/tick?secret=CRON_SECRET — called every minute by cron-job.org.
// Materializes today's doses, sends reminders/retries/escalations, daily
// schedule, and weekly report. Idempotent — safe to run more than once per minute.
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runCronTick();

  return NextResponse.json({ ok: true, ...result });
}
