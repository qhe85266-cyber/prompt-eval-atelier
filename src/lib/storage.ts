import { EVAL_CASES } from "../data/cases";
import type { AnnotationStore, CaseEdit, VariantEdit } from "../types";
import { RUBRIC_KEYS } from "../types";
import { createDefaultStore } from "./defaults";
import { isVerdict } from "./verdict";

const KEY = "prompt-eval-atelier.v1";

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

function normalizeVariant(raw: unknown, fallback: VariantEdit): VariantEdit {
  const base = structuredClone(fallback);
  const rec = asRecord(raw);
  if (!rec) return base;
  const scores = asRecord(rec.scores);
  if (scores) {
    for (const key of RUBRIC_KEYS) {
      const item = asRecord(scores[key]);
      if (!item) continue;
      if (
        typeof item.score === "number" &&
        Number.isInteger(item.score) &&
        item.score >= 1 &&
        item.score <= 5
      ) {
        base.scores[key].score = item.score;
      }
      if (typeof item.note === "string") base.scores[key].note = item.note.slice(0, 800);
    }
  }
  if (isVerdict(rec.verdict)) base.verdict = rec.verdict;
  if (typeof rec.verdictTouched === "boolean") base.verdictTouched = rec.verdictTouched;
  if (typeof rec.pmNote === "string") base.pmNote = rec.pmNote.slice(0, 800);
  return base;
}

function normalizeCase(raw: unknown, fallback: CaseEdit): CaseEdit {
  const base = structuredClone(fallback);
  const rec = asRecord(raw);
  if (!rec) return base;
  const variants = asRecord(rec.variants);
  if (variants) {
    base.variants.A = normalizeVariant(variants.A, base.variants.A);
    base.variants.B = normalizeVariant(variants.B, base.variants.B);
  }
  if (
    rec.decision === "A" ||
    rec.decision === "B" ||
    rec.decision === "tie" ||
    rec.decision === "neither"
  ) {
    base.decision = rec.decision;
  }
  if (typeof rec.decisionNote === "string") base.decisionNote = rec.decisionNote.slice(0, 2000);
  return base;
}

export function normalizeStore(raw: unknown): AnnotationStore {
  const base = createDefaultStore();
  const rec = asRecord(raw);
  if (!rec || rec.version !== 1) return base;
  if (typeof rec.reviewer === "string") base.reviewer = rec.reviewer.slice(0, 40);
  if (typeof rec.roundNote === "string") base.roundNote = rec.roundNote.slice(0, 2000);
  const cases = asRecord(rec.cases);
  if (!cases) return base;
  for (const item of EVAL_CASES) {
    base.cases[item.id] = normalizeCase(cases[item.id], base.cases[item.id]);
  }
  return base;
}

export function loadStore(): AnnotationStore {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return createDefaultStore();
    return normalizeStore(JSON.parse(text) as unknown);
  } catch {
    return createDefaultStore();
  }
}

export function saveStore(store: AnnotationStore): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}
