import {
  parseMedicalHistory,
  type MedicalHistoryValue,
} from "@/lib/medical-history";

export function resolveValidMedicalHistory(
  rawMedicalCond: unknown
): MedicalHistoryValue {
  const parsed = parseMedicalHistory(rawMedicalCond);
  const hasHistory =
    parsed.conditions.length > 0 || (parsed.other?.trim()?.length ?? 0) > 0;

  if (!hasHistory) {
    throw new Error("Medical history is empty or invalid");
  }

  return parsed;
}
