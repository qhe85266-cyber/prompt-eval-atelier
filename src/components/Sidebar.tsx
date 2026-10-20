import { DECISION_LABEL, SUITE_ORDER } from "../copy";
import { EVAL_CASES } from "../data/cases";
import { cx } from "../lib/cx";
import { dirtyCaseCount, isCaseDirty } from "../lib/metrics";
import type { AtelierActions } from "../state/useAtelier";
import type { AnnotationStore } from "../types";
import { VerdictPill } from "./bits";

interface SidebarProps {
  store: AnnotationStore;
  saveOk: boolean;
  view: string;
  suite: string;
  visibleIds: string[];
  actions: AtelierActions;
  onOpen: (id: string) => void;
  onSuite: (suite: string) => void;
  onGuide: () => void;
}

export function Sidebar({
  store,
  saveOk,
  view,
  suite,
  visibleIds,
  actions,
  onOpen,
  onSuite,
  onGuide,
}: SidebarProps) {
  const visible = EVAL_CASES.filter((item) => visibleIds.includes(item.id));
  const dirty = dirtyCaseCount(EVAL_CASES, store);

  return (
    <aside className="sidebar">
      <div className="brand">
        <p className="brand-en">Prompt Eval Atelier</p>
        <h1>提示词评测工坊</h1>
        <p className="brand-note">固定案例 · 不连接模型</p>
      </div>

      <nav className="side-nav" aria-label="工作台">
        <button
          type="button"
          className={cx("nav-btn", view === "overview" && "active")}
          onClick={() => onOpen("overview")}
        >
          <span>总览</span>
          <small>这一轮的尺子和结论</small>
        </button>
        <button type="button" className="nav-btn" onClick={onGuide}>
          <span>尺子说明</span>
          <small>清晰度 · 依据性 · 合规</small>
        </button>
      </nav>

      <div className="filters" role="tablist" aria-label="按套件筛选">
        <button
          type="button"
          role="tab"
          aria-selected={suite === "全部"}
          className={cx("chip", suite === "全部" && "on")}
          onClick={() => onSuite("全部")}
        >
          全部
        </button>
        {SUITE_ORDER.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={suite === name}
            className={cx("chip", suite === name && "on")}
            onClick={() => onSuite(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <ul className="case-list">
        {visible.map((item) => {
          const edit = store.cases[item.id];
          const changed = isCaseDirty(item, store);
          return (
            <li key={item.id}>
            <button
              type="button"
              className={cx("case-btn", view === item.id && "active")}
              onClick={() => onOpen(item.id)}
            >
              <div className="case-btn-top">
                <span className="idx">{item.index}</span>
                {changed ? <span className="dirty">已改</span> : null}
              </div>
              <div className="case-name">{item.title}</div>
              <div className="case-meta">
                {item.suite} · {item.product}
              </div>
              <div className="case-pills">
                <VerdictPill verdict={edit.variants.A.verdict} prefix="A" />
                <VerdictPill verdict={edit.variants.B.verdict} prefix="B" />
              </div>
              <div className="mini-decision">{DECISION_LABEL[edit.decision]}</div>
            </button>
            </li>
          );
        })}
      </ul>

      <footer className="side-foot">
        <p className="progress">
          已动笔 {dirty} / {EVAL_CASES.length}
        </p>
        <label className="field">
          <span>评审人</span>
          <input
            type="text"
            value={store.reviewer}
            maxLength={40}
            placeholder="写入报告的名字"
            onChange={(event) => actions.setReviewer(event.target.value)}
          />
        </label>
        <p className="save-state" aria-live="polite">
          {saveOk ? "修改保存在这台浏览器" : "浏览器拒绝了本地保存，刷新后会丢失"}
        </p>
      </footer>
    </aside>
  );
}
