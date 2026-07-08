export type DoseAction = "taken" | "skip";

export function encodeDoseCallback(doseEventId: string, action: DoseAction): string {
  return `dose:${doseEventId}:${action}`;
}

export function decodeDoseCallback(data: string): { doseEventId: string; action: DoseAction } | null {
  const parts = data.split(":");
  if (parts.length !== 3 || parts[0] !== "dose") return null;
  const [, doseEventId, action] = parts;
  if (action !== "taken" && action !== "skip") return null;
  return { doseEventId, action };
}
