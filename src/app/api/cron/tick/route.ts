import { NextRequest, NextResponse } from "next/server";

// GET /api/cron/tick?secret=CRON_SECRET — called every minute by cron-job.org.
// Materializes today's doses, sends reminders/retries/escalations, checks stock.
// Full state machine implemented in Part D Step 7.
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
