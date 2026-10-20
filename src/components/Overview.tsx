import { useState } from "react";
import { DECISION_LABEL, RUBRIC_META } from "../copy";
import { EVAL_CASES } from "../data/cases";
import { cx } from "../lib/cx";
import {
  buildHints,
  policyGateCount,
  principleLine,
  summarizeSide,
  verdictOverrideCount,
} from "../lib/metrics";
import { formatAvg, suggestDecision } from "../lib/verdict";
import type { AtelierActions } from "../state/useAtelier";
import type { AnnotationStore, RubricKey } from "../types";
import { RUBRIC_KEYS } from "../types";
import { VerdictPill } from "./bits";

export function Overview({
  store,
  actions,
  onOpen,
}: {
  store: AnnotationStore;
  actions: AtelierActions;
  onOpen: (id: string) => void;
}) {
  const [armReset, setArmReset] = useState(false);
  const sideA = summarizeSide(EVAL_CASES, store, "A");
  const sideB = summarizeSide(EVAL_CASES, store, "B");
  const hints = buildHints(EVAL_CASES, store);
  const gates = policyGateCount(EVAL_CASES, store);
  const overrides = verdictOverrideCount(EVAL_CASES, store);
  const gaps = EVAL_CASES.filter((item) => {
    const edit = store.cases[item.id];
    return suggestDecision(edit.variants.A.scores, edit.variants.B.scores) !== edit.decision;
  }).length;

  return (
    <div className="sheet">
      <header className="hero">
        <p className="kicker">评测手记 · 第 1 轮</p>
        <h2>同一份材料，两份提示词，三把尺子。</h2>
        <p className="lede">
          分数和结论都可以改。规则只给出倾向，不替你做决定。样例输出是写好的，用来讨论评测本身。
        </p>
      </header>

      <section className="metrics" aria-label="本轮数字">
        <article className="metric">
          <p className="label">案例</p>
          <p className="metric-value">{EVAL_CASES.length}</p>
          <p className="metric-foot">五个套件，材料相同只换提示词</p>
        </article>
        <article className="metric">
          <p className="label">方案 A 通过</p>
          <p className="metric-value">
            {sideA.pass}
            <span>/{EVAL_CASES.length}</span>
          </p>
          <p className="metric-foot">
            待定 {sideA.review} · 不通过 {sideA.fail}
          </p>
        </article>
        <article className="metric">
          <p className="label">方案 B 通过</p>
          <p className="metric-value">
            {sideB.pass}
            <span>/{EVAL_CASES.length}</span>
          </p>
          <p className="metric-foot">
            待定 {sideB.review} · 不通过 {sideB.fail}
          </p>
        </article>
        <article className="metric">
          <p className="label">合规闸门</p>
          <p className="metric-value">{gates}</p>
          <p className="metric-foot">合规 ≤ 2 的稿，平均分不能救</p>
        </article>
      </section>

      <p className="status-line">
        结论与规则不一致 {gaps} 条 · 人工改判 {overrides} 稿
      </p>

      <section className="panel" aria-label="分项平均">
        <div className="panel-head">
          <h3>分项平均</h3>
          <p>改任何一题的分数，这里会跟着动。</p>
        </div>
        <div className="rubric-grid">
          {RUBRIC_KEYS.map((key) => (
            <RubricMeter
              key={key}
              rubric={key}
              a={sideA[key]}
              b={sideB[key]}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>这一轮在说什么</h3>
          <p>{principleLine()}</p>
        </div>
        {hints.length === 0 ? (
          <p className="empty-hint">这一轮没有触发结构告警。可以换一个杠杆再看。</p>
        ) : (
          <ol className="hints">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>分案</h3>
          <p>点进案例改分数、写改判理由。</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>案例</th>
                <th>A</th>
                <th>B</th>
                <th>规则倾向</th>
                <th>我的结论</th>
              </tr>
            </thead>
            <tbody>
              {EVAL_CASES.map((item) => {
                const edit = store.cases[item.id];
                const suggested = suggestDecision(
                  edit.variants.A.scores,
                  edit.variants.B.scores,
                );
                const gap = suggested !== edit.decision;
                return (
                  <tr key={item.id} className={cx(gap && "gap")}>
                    <th scope="row">
                      <button type="button" className="linkish" onClick={() => onOpen(item.id)}>
                        {item.index} {item.title}
                      </button>
                      <small>
                        {item.suite} · {item.product}
                      </small>
                    </th>
                    <td>
                      <VerdictPill verdict={edit.variants.A.verdict} />
                    </td>
                    <td>
                      <VerdictPill verdict={edit.variants.B.verdict} />
                    </td>
                    <td>{DECISION_LABEL[suggested]}</td>
                    <td>
                      {DECISION_LABEL[edit.decision]}
                      {gap ? <em className="gap-mark">不一致</em> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <label className="field">
          <span>本轮备忘</span>
          <textarea
            value={store.roundNote}
            maxLength={2000}
            rows={4}
            placeholder="这一轮你想记住的取舍。会写进导出的报告。"
            onChange={(event) => actions.setRoundNote(event.target.value)}
          />
        </label>
        <div className="reset-row">
          {armReset ? (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  actions.resetAll();
                  setArmReset(false);
                }}
              >
                确认恢复全部分数和结论
              </button>
              <button type="button" className="btn-ghost" onClick={() => setArmReset(false)}>
                取消
              </button>
            </>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setArmReset(true)}>
              恢复全部基线
            </button>
          )}
          <p>评审人和本轮备忘会保留。</p>
        </div>
      </section>
    </div>
  );
}

function RubricMeter({
  rubric,
  a,
  b,
}: {
  rubric: RubricKey;
  a: number;
  b: number;
}) {
  const meta = RUBRIC_META[rubric];
  return (
    <article className="meter-card">
      <h3>
        {meta.label}
        <small>{meta.en}</small>
      </h3>
      <Meter label="A" value={a} tone="a" />
      <Meter label="B" value={b} tone="b" />
    </article>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: "a" | "b" }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="track" aria-hidden="true">
        <i className={tone} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <b>{formatAvg(value)}</b>
    </div>
  );
}
