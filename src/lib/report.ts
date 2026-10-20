import { CASE_SET_NAME, DECISION_LABEL, RUBRIC_META, VERDICT_LABEL } from "../copy";
import type { AnnotationStore, EvalCase, FixtureVariant, VariantEdit, VariantId } from "../types";
import { RUBRIC_KEYS } from "../types";
import { buildHints, principleLine, summarizeSide } from "./metrics";
import {
  average,
  explainDecision,
  explainSuggestion,
  formatAvg,
  rulesParagraphs,
  suggestDecision,
  suggestVerdict,
} from "./verdict";

function quote(text: string): string {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  if (lines.length === 0) return ">";
  return lines.map((line) => `> ${line}`.trimEnd()).join("\n");
}

function cell(text: string): string {
  return text.replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function formatStamp(now: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

function scoreCell(fixture: FixtureVariant, edit: VariantEdit, key: (typeof RUBRIC_KEYS)[number]): string {
  const current = edit.scores[key].score;
  const baseline = fixture.scores[key].score;
  if (current === baseline) return String(current);
  return `${current}（基线 ${baseline}）`;
}

function variantSection(
  id: VariantId,
  fixture: FixtureVariant,
  edit: VariantEdit,
): string[] {
  const lines: string[] = [];
  const suggested = suggestVerdict(edit.scores);
  const overridden = edit.verdict !== suggested;
  lines.push(`### 方案 ${id} · ${fixture.name}`);
  lines.push("");
  lines.push(`- 假设：${fixture.hypothesis}`);
  lines.push(
    `- 判定：${VERDICT_LABEL[edit.verdict]}${overridden ? " · 人工改判" : ""}`,
  );
  lines.push(`- 规则：${explainSuggestion(edit.scores)}`);
  lines.push(`- 平均：${formatAvg(average(edit.scores))}`);
  if (fixture.marks.length > 0) {
    lines.push(`- 审阅标记：${fixture.marks.map((mark) => mark.text).join("、")}`);
  }
  lines.push("");
  lines.push("**提示词**");
  lines.push("");
  lines.push(quote(fixture.prompt));
  lines.push("");
  lines.push("**样例输出**");
  lines.push("");
  lines.push(quote(fixture.output));
  lines.push("");
  lines.push("| 维度 | 分数 | 笔记 |");
  lines.push("| --- | ---: | --- |");
  for (const key of RUBRIC_KEYS) {
    lines.push(
      `| ${RUBRIC_META[key].label} | ${scoreCell(fixture, edit, key)} | ${cell(edit.scores[key].note)} |`,
    );
  }
  lines.push("");
  lines.push("**总评**");
  lines.push("");
  lines.push(quote(edit.pmNote || "（空）"));
  lines.push("");
  return lines;
}

export function buildReport(cases: EvalCase[], store: AnnotationStore, now: Date): string {
  const lines: string[] = [];
  const sideA = summarizeSide(cases, store, "A");
  const sideB = summarizeSide(cases, store, "B");
  const hints = buildHints(cases, store);

  lines.push("# 提示词评测报告");
  lines.push("");
  lines.push(`Prompt Eval Atelier · ${CASE_SET_NAME}`);
  lines.push("");
  lines.push(`- 评审人：${store.reviewer.trim() || "未署名"}`);
  lines.push(`- 导出时间：${formatStamp(now)}`);
  lines.push("- 说明：样例输出是工坊里的固定文本，不是导出这一刻的模型调用。");
  lines.push("");
  lines.push("## 尺子");
  lines.push("");
  for (const key of RUBRIC_KEYS) {
    const meta = RUBRIC_META[key];
    lines.push(`- **${meta.label}**（${meta.en}）：${meta.question} 扣分看：${meta.miss}`);
  }
  lines.push("");
  for (const rule of rulesParagraphs()) {
    lines.push(`- ${rule}`);
  }
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push("| 指标 | 方案 A | 方案 B |");
  lines.push("| --- | ---: | ---: |");
  lines.push(`| 平均清晰度 | ${formatAvg(sideA.clarity)} | ${formatAvg(sideB.clarity)} |`);
  lines.push(`| 平均依据性 | ${formatAvg(sideA.groundedness)} | ${formatAvg(sideB.groundedness)} |`);
  lines.push(`| 平均合规 | ${formatAvg(sideA.policy)} | ${formatAvg(sideB.policy)} |`);
  lines.push(`| 通过 | ${sideA.pass} | ${sideB.pass} |`);
  lines.push(`| 待定 | ${sideA.review} | ${sideB.review} |`);
  lines.push(`| 不通过 | ${sideA.fail} | ${sideB.fail} |`);
  lines.push("");
  lines.push("| 案例 | 方案 A | 方案 B | 规则倾向 | 我的结论 |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const item of cases) {
    const edit = store.cases[item.id];
    const suggested = suggestDecision(edit.variants.A.scores, edit.variants.B.scores);
    const gap = suggested === edit.decision ? "" : "（不一致）";
    lines.push(
      `| ${item.index} ${item.title} | ${VERDICT_LABEL[edit.variants.A.verdict]} | ${VERDICT_LABEL[edit.variants.B.verdict]} | ${DECISION_LABEL[suggested]} | ${DECISION_LABEL[edit.decision]}${gap} |`,
    );
  }
  lines.push("");
  lines.push("## 本轮备忘");
  lines.push("");
  lines.push(quote(store.roundNote.trim() || "（空）"));
  lines.push("");
  lines.push("## 这一轮在说什么");
  lines.push("");
  if (hints.length === 0) {
    lines.push("- 这一轮没有触发结构告警。");
  } else {
    for (const hint of hints) lines.push(`- ${hint}`);
  }
  lines.push(`- ${principleLine()}`);
  lines.push("");

  for (const item of cases) {
    const edit = store.cases[item.id];
    const suggested = suggestDecision(edit.variants.A.scores, edit.variants.B.scores);
    const aligned = suggested === edit.decision;
    lines.push(`## ${item.index} ${item.title}`);
    lines.push("");
    lines.push(`- 套件：${item.suite}`);
    lines.push(`- 产品：${item.product}`);
    lines.push(`- 风险：${item.risk}`);
    lines.push(`- 杠杆：${item.iterationLever}`);
    lines.push("");
    lines.push("**用户原话**");
    lines.push("");
    lines.push(quote(item.userInput));
    lines.push("");
    lines.push("**评测意图**");
    lines.push("");
    lines.push(quote(item.intent));
    lines.push("");
    for (const evidence of item.evidence) {
      lines.push(`**依据 · ${evidence.title}**`);
      lines.push("");
      lines.push(quote(evidence.body));
      lines.push("");
    }
    lines.push("| 维度 | 方案 A | 方案 B | B−A |");
    lines.push("| --- | ---: | ---: | ---: |");
    for (const key of RUBRIC_KEYS) {
      const a = edit.variants.A.scores[key].score;
      const b = edit.variants.B.scores[key].score;
      const delta = b - a;
      lines.push(
        `| ${RUBRIC_META[key].label} | ${a} | ${b} | ${delta > 0 ? `+${delta}` : delta} |`,
      );
    }
    lines.push("");
    lines.push(...variantSection("A", item.variants.A, edit.variants.A));
    lines.push(...variantSection("B", item.variants.B, edit.variants.B));
    lines.push("**本轮结论**");
    lines.push("");
    lines.push(
      aligned
        ? `${DECISION_LABEL[edit.decision]} · 与规则倾向一致。`
        : `${DECISION_LABEL[edit.decision]} · 与规则倾向不一致。规则倾向${DECISION_LABEL[suggested]}：${explainDecision(edit.variants.A.scores, edit.variants.B.scores)}。`,
    );
    lines.push("");
    lines.push(quote(edit.decisionNote || "（空）"));
    lines.push("");
  }

  lines.push("## 下一轮怎么改");
  lines.push("");
  lines.push(principleLine());
  lines.push("");
  lines.push("本报告由提示词评测工坊在浏览器本地生成。");
  lines.push("");
  return lines.join("\n");
}

export const REPORT_FILENAME = "prompt-eval-atelier-report.md";
