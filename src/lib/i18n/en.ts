export const en = {
  dailySchedule: (patient: string) => `Good morning, ${patient}. Today's medicines:`,
  reminder: (medicine: string, dosage: string, session: string) =>
    `⏰ Time for your medicine: ${medicine} — ${dosage} (${session}). Have you taken it?`,
  retry: (medicine: string, dosage: string) =>
    `Reminder again: ${medicine} — ${dosage}. Please confirm.`,
  escalation: (patient: string, medicine: string, dosage: string, time: string) =>
    `⚠️ ${patient} has not confirmed ${medicine} (${dosage}) due at ${time}. Please check in.`,
  lowStock: (medicine: string, patient: string, stockQty: string, threshold: string) =>
    `📦 Low stock: ${medicine} for ${patient} has ${stockQty} left (threshold ${threshold}). Please refill.`,
  weeklyReport: (patient: string, dateRange: string, taken: number, total: number, pct: number, missed: number, skipped: number) =>
    `📊 Weekly adherence for ${patient} (${dateRange}): Taken ${taken}/${total} (${pct}%). Missed ${missed}. Skipped ${skipped}.`,
  buttonTaken: "✅ Taken",
  buttonSkip: "⏭️ Skip",
  linked: (role: string, patient: string) => `You're connected as ${role} for ${patient}.`,
  help: "Commands:\n/today — see today's medicine schedule\n/help — show this message",
  notLinked: "This chat isn't linked to a patient yet. Ask the admin for your invite link.",
  invalidLinkCode: "That invite link is invalid or already used. Ask the admin for a new one.",
};

export type Dictionary = typeof en;
