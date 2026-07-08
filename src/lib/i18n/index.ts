import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

export type Language = "en" | "hi" | "mr";

const dictionaries = { en, hi, mr };

export function getDictionary(language: Language) {
  return dictionaries[language];
}
