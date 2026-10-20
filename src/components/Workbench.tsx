import { useState } from "react";
import { DECISION_LABEL, RUBRIC_META } from "../copy";
import { cx } from "../lib/cx";
import { signedDelta } from "../lib/metrics";
import { explainDecision, formatAvg, suggestDecision, average } from "../lib/verdict";
import type { AtelierActions } from "../state/useAtelier";
import type { CaseEdit, Decision, EvalCase } from "../types";
import { RUBRIC_KEYS } from "../types";
import { DecisionSeal } from "./bits";
import { VariantColumn } from "./VariantColumn";

const DECISIONS: Decision[] = ["A", "B", "tie", "neither"];

export function Workbench({
  evalCase,
  edit,
  actions,
  prevId,
  nextId,
  onOpen,
}: {
  evalCase: EvalCase;
  edit: CaseEdit;
  actions: AtelierActions;
  prevId: string | null;
  nextId: string | null;
  onOpen: (id: string) => void;
}) {
  const [armReset, setArmReset] = useState(false);
  const suggested = suggestDecision(edit.variants.A.scores, edit.variants.B.scores);
  const aligned = suggested === edit.decision;
  const avgDelta = average(edit.variants.B.scores) - average(edit.variants.A.scores);

  return (
    <div className="sheet">
      <header className="case-head">
        <div>
          <p className="kicker">
            {evalCase.index} · {evalCase.suite} · {evalCase.product}
          </p>
          <div className="case-title-row">
            <h2>{evalCase.title}</h2>
            <DecisionSeal decision={edit.decision} />
          </div>
          <p className="risk">风险 · {evalCase.risk}</p>
        </div>
        <div className="head-actions">
          {armReset ? (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  actions.resetCase(evalCase.id);
                  setArmReset(false);
                }}
              >
                确认恢复
              </button>
              <button type="button" className="btn-ghost" onClick={() => setArmReset(false)}>
                取消
              </button>
            </>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setArmReset(true)}>
              恢复本案例基线
            </button>
          )}
        </div>
      </header>

      <p className="lever">
        <span>这一稿改动的杠杆</span>
        {evalCase.iterationLever}
      </p>

      <section className="context">
        <article>
          <h3>用户原话</h3>
          <p className="quote">{evalCase.userInput}</p>
        </article>
        <article>
          <h3>评测意图</h3>
          <p>{evalCase.intent}</p>
        </article>
        <article>
          <h3>对照方式</h3>
          <p>两稿看到的材料相同，差在提示词。样例输出是事先写好的，用来演示这套尺子。</p>
        </article>
      </section>

      <section className="evidence" aria-label="依据材料">
        {evalCase.evidence.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <div className="deltas" aria-label="方案 B 减方案 A">
        <span className="delta-label">B − A</span>
        {RUBRIC_KEYS.map((key) => {
          const delta =
            edit.variants.B.scores[key].score - edit.variants.A.scores[key].score;
          return (
            <span key={key} className={cx("delta", delta > 0 && "up", delta < 0 && "down")}>
              {RUBRIC_META[key].label} {signedDelta(delta)}
            </span>
          );
        })}
        <span className={cx("delta", avgDelta > 0 && "up", avgDelta < 0 && "down")}>
          平均 {avgDelta > 0 ? "+" : ""}
          {formatAvg(avgDelta)}
        </span>
      </div>

      <div className="compare">
        <VariantColumn
          fixture={evalCase.variants.A}
          edit={edit.variants.A}
          onScore={(key, score) => actions.setScore(evalCase.id, "A", key, score)}
          onScoreNote={(key, note) => actions.setScoreNote(evalCase.id, "A", key, note)}
          onVerdict={(verdict) => actions.setVerdict(evalCase.id, "A", verdict)}
          onFollowRule={() => actions.followRule(evalCase.id, "A")}
          onPmNote={(note) => actions.setPmNote(evalCase.id, "A", note)}
        />
        <VariantColumn
          fixture={evalCase.variants.B}
          edit={edit.variants.B}
          onScore={(key, score) => actions.setScore(evalCase.id, "B", key, score)}
          onScoreNote={(key, note) => actions.setScoreNote(evalCase.id, "B", key, note)}
          onVerdict={(verdict) => actions.setVerdict(evalCase.id, "B", verdict)}
          onFollowRule={() => actions.followRule(evalCase.id, "B")}
          onPmNote={(note) => actions.setPmNote(evalCase.id, "B", note)}
        />
      </div>

      <footer className={cx("decision", !aligned && "decision-gap")}>
        <div>
          <p className="label">规则倾向</p>
          <p className="decision-suggestion">
            {DECISION_LABEL[suggested]}
            <span>{explainDecision(edit.variants.A.scores, edit.variants.B.scores)}</span>
          </p>
        </div>
        <div>
          <p className="label">我的结论</p>
          <div className="segment" role="radiogroup" aria-label="本轮结论">
            {DECISIONS.map((decision) => (
              <button
                key={decision}
                type="button"
                role="radio"
                aria-checked={edit.decision === decision}
                className={cx("seg", edit.decision === decision && "on")}
                onClick={() => actions.setDecision(evalCase.id, decision)}
              >
                {DECISION_LABEL[decision]}
              </button>
            ))}
          </div>
          <p className={cx("rule-line", !aligned && "diverged")} aria-live="polite">
            {aligned ? "与规则倾向一致。" : "你的结论和规则倾向不同，报告会同时记下两边。"}
          </p>
        </div>
        <label className="field">
          <span>结论说明</span>
          <textarea
            value={edit.decisionNote}
            maxLength={2000}
            rows={3}
            placeholder="为什么是这个结论？面试时讲的就是这段。"
            onChange={(event) => actions.setDecisionNote(evalCase.id, event.target.value)}
          />
        </label>
        <div className="pager">
          <button type="button" className="btn-ghost" disabled={!prevId} onClick={() => prevId && onOpen(prevId)}>
            上一条
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!nextId}
            onClick={() => nextId && onOpen(nextId)}
          >
            下一条
          </button>
        </div>
      </footer>
    </div>
  );
}
