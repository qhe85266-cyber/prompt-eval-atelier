import type {
  AnnotationStore,
  EvalCase,
  FixtureVariant,
  VariantEdit,
  VariantId,
} from "../types";
import { RUBRIC_KEYS } from "../types";
import { POLICY_GATE, suggestVerdict } from "./verdict";

export interface SideSummary {
  clarity: number;
  groundedness: number;
  policy: number;
  pass: number;
  review: number;
  fail: number;
}

export function summarizeSide(
  cases: EvalCase[],
  store: AnnotationStore,
  id: VariantId,
): SideSummary {
  const totals = {
    clarity: 0,
    groundedness: 0,
    policy: 0,
    pass: 0,
    review: 0,
    fail: 0,
  };
  for (const item of cases) {
    const variant = store.cases[item.id].variants[id];
    totals.clarity += variant.scores.clarity.score;
    totals.groundedness += variant.scores.groundedness.score;
    totals.policy += variant.scores.policy.score;
    totals[variant.verdict] += 1;
  }
  const count = cases.length || 1;
  return {
    clarity: totals.clarity / count,
    groundedness: totals.groundedness / count,
    policy: totals.policy / count,
    pass: totals.pass,
    review: totals.review,
    fail: totals.fail,
  };
}

export function policyGateCount(cases: EvalCase[], store: AnnotationStore): number {
  let count = 0;
  for (const item of cases) {
    for (const id of ["A", "B"] as const) {
      if (store.cases[item.id].variants[id].scores.policy.score <= POLICY_GATE) count += 1;
    }
  }
  return count;
}

export function verdictOverrideCount(cases: EvalCase[], store: AnnotationStore): number {
  let count = 0;
  for (const item of cases) {
    for (const id of ["A", "B"] as const) {
      const variant = store.cases[item.id].variants[id];
      if (variant.verdict !== suggestVerdict(variant.scores)) count += 1;
    }
  }
  return count;
}

export function isVariantDirty(fixture: FixtureVariant, edit: VariantEdit): boolean {
  if (edit.verdict !== fixture.verdict || edit.pmNote !== fixture.pmNote) return true;
  return RUBRIC_KEYS.some(
    (key) =>
      edit.scores[key].score !== fixture.scores[key].score ||
      edit.scores[key].note !== fixture.scores[key].note,
  );
}

export function isCaseDirty(item: EvalCase, store: AnnotationStore): boolean {
  const edit = store.cases[item.id];
  if (edit.decision !== item.defaultDecision || edit.decisionNote !== item.defaultDecisionNote) {
    return true;
  }
  return (
    isVariantDirty(item.variants.A, edit.variants.A) ||
    isVariantDirty(item.variants.B, edit.variants.B)
  );
}

export function dirtyCaseCount(cases: EvalCase[], store: AnnotationStore): number {
  return cases.filter((item) => isCaseDirty(item, store)).length;
}

export function buildHints(cases: EvalCase[], store: AnnotationStore): string[] {
  const hints: string[] = [];
  for (const item of cases) {
    const sides = (["A", "B"] as const).map((id) => ({
      id,
      scores: store.cases[item.id].variants[id].scores,
    }));
    const verdicts = sides.map((side) => suggestVerdict(side.scores));
    if (verdicts[0] === "fail" && verdicts[1] === "fail") {
      hints.push(
        `「${item.title}」两稿都未通过。不要在失败稿里挑一个较不差的。下一轮按这个杠杆重写：${item.iterationLever}`,
      );
      continue;
    }
    const sharp = sides.find(
      (side) => side.scores.clarity.score >= 5 && side.scores.groundedness.score <= 2,
    );
    if (sharp) {
      hints.push(
        `「${item.title}」方案 ${sharp.id}：清晰度 ${sharp.scores.clarity.score}，依据性 ${sharp.scores.groundedness.score}。句子好读，但用户照做会错。`,
      );
      continue;
    }
    const overRefuse = sides.find(
      (side) => side.scores.policy.score >= 5 && side.scores.groundedness.score <= 2,
    );
    if (overRefuse) {
      hints.push(
        `「${item.title}」方案 ${overRefuse.id}：合规 ${overRefuse.scores.policy.score}，依据性 ${overRefuse.scores.groundedness.score}。红线守住了，可引用的材料却被藏起来。`,
      );
    }
  }
  return hints;
}

export function signedDelta(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function principleLine(): string {
  return "案例集保持不变。一次只改提示词里的一个杠杆，然后回到同一句用户原话上看分项。";
}
