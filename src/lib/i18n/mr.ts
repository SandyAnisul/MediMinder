import type { Dictionary } from "./en";

// Translations are a first draft — have a native speaker review before shipping to real patients.
export const mr: Dictionary = {
  dailySchedule: (patient) => `शुभ सकाळ, ${patient}. आजची औषधे:`,
  reminder: (medicine, dosage, session) =>
    `⏰ औषध घेण्याची वेळ: ${medicine} — ${dosage} (${session}). तुम्ही घेतले का?`,
  retry: (medicine, dosage) => `पुन्हा आठवण: ${medicine} — ${dosage}. कृपया पुष्टी करा.`,
  escalation: (patient, medicine, dosage, time) =>
    `⚠️ ${patient} ने ${medicine} (${dosage}) ची पुष्टी केलेली नाही, जी ${time} वाजता घ्यायची होती. कृपया चौकशी करा.`,
  lowStock: (medicine, patient, stockQty, threshold) =>
    `📦 साठा कमी आहे: ${patient} साठी ${medicine} फक्त ${stockQty} शिल्लक आहे (मर्यादा ${threshold}). कृपया पुन्हा भरा.`,
  weeklyReport: (patient, dateRange, taken, total, pct, missed, skipped) =>
    `📊 ${patient} चा साप्ताहिक अहवाल (${dateRange}): घेतलेले ${taken}/${total} (${pct}%). चुकलेले ${missed}. वगळलेले ${skipped}.`,
  buttonTaken: "✅ घेतले",
  buttonSkip: "⏭️ वगळा",
  linked: (role, patient) => `तुम्ही ${patient} साठी ${role} म्हणून जोडले गेला आहात.`,
};
