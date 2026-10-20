import { EVAL_CASES } from "../data/cases";
import type { AnnotationStore, CaseEdit, FixtureVariant, VariantEdit } from "../types";

function toVariantEdit(variant: FixtureVariant): VariantEdit {
  return {
    scores: structuredClone(variant.scores),
    verdict: variant.verdict,
    verdictTouched: false,
    pmNote: variant.pmNote,
  };
}

export function defaultCaseEdit(caseId: string): CaseEdit | null {
  const item = EVAL_CASES.find((entry) => entry.id === caseId);
  if (!item) return null;
  return {
    variants: {
      A: toVariantEdit(item.variants.A),
      B: toVariantEdit(item.variants.B),
    },
    decision: item.defaultDecision,
    decisionNote: item.defaultDecisionNote,
  };
}

export function createDefaultStore(): AnnotationStore {
  const cases: AnnotationStore["cases"] = {};
  for (const item of EVAL_CASES) {
    const edit = defaultCaseEdit(item.id);
    if (edit) cases[item.id] = edit;
  }
  return {
    version: 1,
    reviewer: "",
    roundNote: "",
    cases,
  };
}
