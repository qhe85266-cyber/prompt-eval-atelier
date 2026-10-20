import { RUBRIC_META, VERDICT_LABEL } from "../copy";
import { cx } from "../lib/cx";
import { POLICY_GATE, average, explainSuggestion, formatAvg, suggestVerdict } from "../lib/verdict";
import type { FixtureVariant, RubricKey, VariantEdit, Verdict } from "../types";
import { RUBRIC_KEYS } from "../types";

const VERDICTS: Verdict[] = ["pass", "review", "fail"];

export function VariantColumn({
  fixture,
  edit,
  onScore,
  onScoreNote,
  onVerdict,
  onFollowRule,
  onPmNote,
}: {
  fixture: FixtureVariant;
  edit: VariantEdit;
  onScore: (key: RubricKey, score: number) => void;
  onScoreNote: (key: RubricKey, note: string) => void;
  onVerdict: (verdict: Verdict) => void;
  onFollowRule: () => void;
  onPmNote: (note: string) => void;
}) {
  const suggested = suggestVerdict(edit.scores);
  const diverged = suggested !== edit.verdict;

  return (
    <article className={cx("variant", fixture.id === "A" ? "variant-a" : "variant-b")}>
      <header className="variant-head">
        <p className="kicker">方案 {fixture.id}</p>
        <h3>{fixture.name}</h3>
        <p className="hypothesis">{fixture.hypothesis}</p>
        <p className="avg">
          平均 {formatAvg(average(edit.scores))}
          <span className={cx("pill", `pill-${edit.verdict}`)}>{VERDICT_LABEL[edit.verdict]}</span>
        </p>
      </header>

      <section>
        <h4>提示词</h4>
        <p className="prompt">{fixture.prompt}</p>
      </section>

      <section>
        <h4>样例输出</h4>
        <p className="output">{fixture.output}</p>
        <ul className="marks">
          {fixture.marks.map((mark) => (
            <li key={mark.text} className={cx("mark", mark.tone)}>
              {mark.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="rubrics" aria-label={`方案 ${fixture.id} 的分数`}>
        {RUBRIC_KEYS.map((key) => {
          const meta = RUBRIC_META[key];
          const current = edit.scores[key];
          const baseline = fixture.scores[key].score;
          return (
            <div key={key} className="rubric">
              <div className="rubric-label">
                <span>
                  {meta.label}
                  {key === "policy" && current.score <= POLICY_GATE ? <em className="gate">闸门</em> : null}
                </span>
                {current.score !== baseline ? <small>基线 {baseline}</small> : null}
              </div>
              <div
                className="pips"
                role="radiogroup"
                aria-label={`${meta.label} 分数`}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    onScore(key, Math.min(5, current.score + 1));
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    onScore(key, Math.max(1, current.score - 1));
                  }
                }}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={current.score === value}
                    className={cx("pip", value <= current.score && "on", value === current.score && "current")}
                    onClick={() => onScore(key, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <textarea
                value={current.note}
                maxLength={800}
                rows={2}
                aria-label={`${meta.label} 笔记`}
                placeholder="这条分数为什么是这个数"
                onChange={(event) => onScoreNote(key, event.target.value)}
              />
            </div>
          );
        })}
      </section>

      <section className="verdict-box">
        <h4>我的判定</h4>
        <div className="segment" role="radiogroup" aria-label={`方案 ${fixture.id} 判定`}>
          {VERDICTS.map((verdict) => (
            <button
              key={verdict}
              type="button"
              role="radio"
              aria-checked={edit.verdict === verdict}
              className={cx("seg", `seg-${verdict}`, edit.verdict === verdict && "on")}
              onClick={() => onVerdict(verdict)}
            >
              {VERDICT_LABEL[verdict]}
            </button>
          ))}
        </div>
        <p className={cx("rule-line", diverged && "diverged")} aria-live="polite">
          {explainSuggestion(edit.scores)}
          {diverged ? ` · 已改判为${VERDICT_LABEL[edit.verdict]}` : ""}
        </p>
        {diverged ? (
          <button type="button" className="btn-text" onClick={onFollowRule}>
            跟回规则
          </button>
        ) : null}
        <label className="field">
          <span>总评</span>
          <textarea
            value={edit.pmNote}
            maxLength={800}
            rows={3}
            onChange={(event) => onPmNote(event.target.value)}
          />
        </label>
      </section>
    </article>
  );
}
