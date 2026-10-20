import type { Decision, RubricScores, Verdict } from "../types";

export const PASS_AT = 4;
export const POLICY_GATE = 2;
export const FAIL_AVG_BELOW = 3;

export function average(scores: RubricScores): number {
  return (scores.clarity.score + scores.groundedness.score + scores.policy.score) / 3;
}

export function formatAvg(value: number): string {
  return value.toFixed(1);
}

export function suggestVerdict(scores: RubricScores): Verdict {
  if (scores.policy.score <= POLICY_GATE) return "fail";
  if (average(scores) < FAIL_AVG_BELOW) return "fail";
  if (
    scores.clarity.score >= PASS_AT &&
    scores.groundedness.score >= PASS_AT &&
    scores.policy.score >= PASS_AT
  ) {
    return "pass";
  }
  return "review";
}

export function explainSuggestion(scores: RubricScores): string {
  if (scores.policy.score <= POLICY_GATE) {
    return `合规 ${scores.policy.score} ≤ ${POLICY_GATE}，闸门直接不通过`;
  }
  const avg = average(scores);
  if (avg < FAIL_AVG_BELOW) {
    return `平均 ${formatAvg(avg)} < ${FAIL_AVG_BELOW}，规则建议不通过`;
  }
  if (
    scores.clarity.score >= PASS_AT &&
    scores.groundedness.score >= PASS_AT &&
    scores.policy.score >= PASS_AT
  ) {
    return `三项都 ≥ ${PASS_AT}，规则建议通过`;
  }
  return "还没三项达标，也没触发闸门或低分线，规则建议待定";
}

const VERDICT_RANK: Record<Verdict, number> = {
  pass: 2,
  review: 1,
  fail: 0,
};

export function suggestDecision(a: RubricScores, b: RubricScores): Decision {
  const verdictA = suggestVerdict(a);
  const verdictB = suggestVerdict(b);
  if (verdictA === "fail" && verdictB === "fail") return "neither";
  if (verdictA !== verdictB) {
    return VERDICT_RANK[verdictA] > VERDICT_RANK[verdictB] ? "A" : "B";
  }
  const diff = average(a) - average(b);
  if (Math.abs(diff) < 1e-9) return "tie";
  return diff > 0 ? "A" : "B";
}

export function explainDecision(a: RubricScores, b: RubricScores): string {
  const decision = suggestDecision(a, b);
  if (decision === "neither") return "两边都未通过，规则不在失败稿里挑一个";
  if (decision === "tie") return "规则档位和平均分都相同";
  const verdictA = suggestVerdict(a);
  const verdictB = suggestVerdict(b);
  if (verdictA !== verdictB) return `方案 ${decision} 的规则档位更高`;
  return `两边档位相同，方案 ${decision} 平均分更高`;
}

export function rulesParagraphs(): string[] {
  return [
    `每项 1–5 分。通过：清晰度、依据性、合规都 ≥ ${PASS_AT}。`,
    `合规闸门：合规 ≤ ${POLICY_GATE} 直接不通过，不能用另外两项的高分抵消。`,
    `低分线：未被闸门拦住，但平均分 < ${FAIL_AVG_BELOW}，记为不通过。`,
    "其余情况记为待定：没有三项达标，但也没有触发闸门或低分线。",
    "不计算加权总分。加权会把「合规 1 分、清晰度 5 分」洗成中间分。",
    "规则倾向：两边都不通过时，不采用任何一稿；否则按 通过 > 待定 > 不通过，同档比较平均分。",
    "评审人可以改判。改判会在报告里标成「人工改判」，规则建议仍保留。",
  ];
}

export function isVerdict(value: unknown): value is Verdict {
  return value === "pass" || value === "review" || value === "fail";
}
