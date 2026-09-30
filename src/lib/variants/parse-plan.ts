import { isAspectRatio, nearestAspect, type AspectRatio } from "./aspect";

export type PlannedVariant = {
  name: string;
  composition: string;
  prompt: string;
  aspectRatio: AspectRatio;
  mechanism: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    const arrayStart = raw.indexOf("[");
    const arrayEnd = raw.lastIndexOf("]");
    if (arrayStart < 0 || arrayEnd <= arrayStart) {
      throw new Error("The plan was not readable. Try again.");
    }
    return JSON.parse(raw.slice(arrayStart, arrayEnd + 1));
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export function parsePlan(text: string, fallbackAspect: AspectRatio): PlannedVariant[] {
  const parsed = extractJson(text);
  const record = asRecord(parsed);
  const list = Array.isArray(parsed)
    ? parsed
    : record && Array.isArray(record.variants)
      ? record.variants
      : null;
  if (!list) throw new Error("The plan did not include ten variants. Try again.");

  const seen = new Set<string>();
  const variants: PlannedVariant[] = [];
  for (const item of list) {
    const row = asRecord(item);
    if (!row) continue;
    const name = clip(row.name, 64).replace(/^[\d.\s-]+/, "");
    const composition = clip(row.composition, 320);
    const prompt = clip(row.prompt, 1800);
    const mechanism = clip(row.mechanism, 80) || name;
    const requested = clip(row.aspectRatio, 16);
    const aspectRatio = isAspectRatio(requested) ? requested : fallbackAspect;
    const key = name.toLowerCase();
    if (name.length < 2 || composition.length < 12 || prompt.length < 80) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push({ name, composition, prompt, aspectRatio, mechanism });
    if (variants.length === 10) break;
  }

  if (variants.length !== 10) {
    throw new Error("The plan was incomplete. Try again.");
  }
  return variants;
}

export function padNumber(n: number): string {
  return String(n).padStart(3, "0");
}

export function sourceAspectFromSize(width: number, height: number): AspectRatio {
  return nearestAspect(width, height);
}
