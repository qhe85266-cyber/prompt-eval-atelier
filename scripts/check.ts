import { EVAL_CASES } from "../src/data/cases";
import { createDefaultStore } from "../src/lib/defaults";
import { buildHints } from "../src/lib/metrics";
import { buildReport } from "../src/lib/report";
import { normalizeStore } from "../src/lib/storage";
import type { RubricScores } from "../src/types";
import {
  suggestDecision,
  suggestVerdict,
} from "../src/lib/verdict";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: 期望 ${String(expected)}，实际 ${String(actual)}`);
  }
}

function scores(clarity: number, groundedness: number, policy: number): RubricScores {
  const note = "检查用";
  return {
    clarity: { score: clarity, note },
    groundedness: { score: groundedness, note },
    policy: { score: policy, note },
  };
}

assertEqual(suggestVerdict(scores(5, 5, 2)), "fail", "合规闸门");
assertEqual(suggestVerdict(scores(4, 4, 4)), "pass", "三项达标");
assertEqual(suggestVerdict(scores(5, 2, 4)), "review", "高清晰低依据");
assertEqual(suggestVerdict(scores(2, 2, 3)), "fail", "低分线");
assertEqual(suggestVerdict(scores(3, 3, 3)), "review", "平均刚好 3");
assertEqual(suggestVerdict(scores(4, 4, 3)), "review", "未三项达标");
assertEqual(suggestDecision(scores(1, 1, 1), scores(4, 4, 2)), "neither", "双失败");
assertEqual(suggestDecision(scores(5, 5, 5), scores(3, 2, 5)), "A", "通过高于待定");
assertEqual(suggestDecision(scores(5, 5, 5), scores(4, 4, 4)), "A", "同档比平均");
assertEqual(suggestDecision(scores(4, 4, 4), scores(4, 4, 4)), "tie", "完全相同");

const ids = new Set<string>();
for (const item of EVAL_CASES) {
  assert(!ids.has(item.id), `重复 id ${item.id}`);
  ids.add(item.id);
  assert(item.userInput.length > 0 && item.intent.length > 0, `${item.id} 缺少题面`);
  assert(item.evidence.length > 0, `${item.id} 缺少材料`);
  for (const id of ["A", "B"] as const) {
    const variant = item.variants[id];
    assert(variant.prompt.length > 10 && variant.output.length > 10, `${item.id} ${id} 内容过短`);
    assert(variant.marks.length >= 2, `${item.id} ${id} 缺少审阅标记`);
    assertEqual(variant.verdict, suggestVerdict(variant.scores), `${item.id} ${id} 判定与规则不一致`);
  }
  assertEqual(
    item.defaultDecision,
    suggestDecision(item.variants.A.scores, item.variants.B.scores),
    `${item.id} 默认结论与规则倾向不一致`,
  );
}

const store = createDefaultStore();
const hints = buildHints(EVAL_CASES, store);
assertEqual(hints.length, 3, "结构告警数量");
assert(hints.some((hint) => hint.includes("投诉升级")), "双失败告警");
assert(hints.some((hint) => hint.includes("导出报表")), "清晰但不可照做");
assert(hints.some((hint) => hint.includes("条款问句")), "过度拒答");

const baseline = buildReport(EVAL_CASES, store, new Date("2026-10-20T02:00:00Z"));
assert(baseline.includes("未署名"), "默认评审人");
assert(baseline.includes("2026"), "导出时间");
for (const item of EVAL_CASES) {
  assert(baseline.includes(item.title), `报告缺少 ${item.title}`);
}

function section(markdown: string, heading: string): string {
  const token = `## ${heading}`;
  const start = markdown.indexOf(token);
  assert(start >= 0, `缺少标题 ${token}`);
  const after = start + token.length;
  const next = markdown.indexOf("\n## ", after);
  return markdown.slice(start, next === -1 ? undefined : next);
}

const refund = section(baseline, "01 退款越权");
assert(refund.includes("判定：不通过"), "退款 A 基线不通过");
assert(!refund.includes("人工改判"), "基线报告不应出现改判标记");

store.cases["refund-overpromise"].variants.A.verdict = "pass";
const edited = buildReport(EVAL_CASES, store, new Date("2026-10-20T02:00:00Z"));
assert(section(edited, "01 退款越权").includes("判定：通过 · 人工改判"), "改判要写进报告");
store.cases["export-oneliner"].decision = "tie";
const disagreed = buildReport(EVAL_CASES, store, new Date("2026-10-20T02:00:00Z"));
assert(section(disagreed, "06 导出报表的短与全").includes("与规则倾向不一致"), "分歧要写进报告");

const kept = normalizeStore({
  version: 1,
  reviewer: "林可",
  roundNote: "记住闸门",
  cases: {
    "refund-overpromise": {
      variants: {
        A: { scores: { clarity: { score: 9, note: "越界" }, groundedness: { score: 3, note: "ok" } } },
      },
      decision: "tie",
    },
  },
});
assertEqual(kept.reviewer, "林可", "保留评审人");
assertEqual(kept.roundNote, "记住闸门", "保留备忘");
assertEqual(kept.cases["refund-overpromise"].decision, "tie", "保留结论");
assertEqual(kept.cases["refund-overpromise"].variants.A.scores.clarity.score, 4, "丢掉越界分数");
assertEqual(kept.cases["refund-overpromise"].variants.A.scores.groundedness.score, 3, "保留合法分数");
assertEqual(normalizeStore({ version: 2, reviewer: "丢弃" }).reviewer, "", "版本不对就回到基线");

console.log(`check ok · ${EVAL_CASES.length} cases`);
