import type { Dictionary } from "./en";

// Translations are a first draft — have a native speaker review before shipping to real patients.
export const hi: Dictionary = {
  dailySchedule: (patient) => `सुप्रभात, ${patient}. आज की दवाइयाँ:`,
  reminder: (medicine, dosage, session) =>
    `⏰ दवा लेने का समय: ${medicine} — ${dosage} (${session}). क्या आपने ले ली?`,
  retry: (medicine, dosage) => `फिर से याद दिला रहे हैं: ${medicine} — ${dosage}. कृपया पुष्टि करें।`,
  escalation: (patient, medicine, dosage, time) =>
    `⚠️ ${patient} ने ${medicine} (${dosage}) की पुष्टि नहीं की, जो ${time} बजे लेनी थी। कृपया संपर्क करें।`,
  lowStock: (medicine, patient, stockQty, threshold) =>
    `📦 स्टॉक कम है: ${patient} के लिए ${medicine} की ${stockQty} बची है (सीमा ${threshold})। कृपया दोबारा भरें।`,
  weeklyReport: (patient, dateRange, taken, total, pct, missed, skipped) =>
    `📊 ${patient} की साप्ताहिक रिपोर्ट (${dateRange}): ली गई ${taken}/${total} (${pct}%)। छूटी ${missed}। छोड़ी ${skipped}।`,
  buttonTaken: "✅ ले ली",
  buttonSkip: "⏭️ छोड़ें",
  linked: (role, patient) => `आप ${patient} के लिए ${role} के रूप में जुड़ गए हैं।`,
};
