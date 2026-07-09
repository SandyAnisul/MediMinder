import type { FrequencyConfig, FrequencyType } from "@/lib/types/database";
import { dayOfWeekForDate, daysBetween } from "@/lib/utils/timezone";

export function isDueToday(
  frequencyType: FrequencyType,
  frequencyConfig: FrequencyConfig,
  startDate: string,
  endDate: string | null,
  todayStr: string,
): boolean {
  if (startDate > todayStr) return false;
  if (endDate && endDate < todayStr) return false;

  switch (frequencyType) {
    case "everyday":
      return true;

    case "alternate": {
      if (!("anchor_date" in frequencyConfig)) return false;
      const diff = daysBetween(frequencyConfig.anchor_date, todayStr);
      return diff >= 0 && diff % 2 === 0;
    }

    case "weekly": {
      if (!("weekdays" in frequencyConfig)) return false;
      return frequencyConfig.weekdays.includes(dayOfWeekForDate(todayStr));
    }

    case "monthly": {
      if (!("day_of_month" in frequencyConfig)) return false;
      const dayOfMonth = Number(todayStr.split("-")[2]);
      return dayOfMonth === frequencyConfig.day_of_month;
    }

    case "specific_dates": {
      if (!("dates" in frequencyConfig)) return false;
      return frequencyConfig.dates.includes(todayStr);
    }

    default:
      return false;
  }
}
