import { useEffect, useMemo, useState } from "react";
import { Overview } from "./components/Overview";
import { ReportDialog } from "./components/ReportDialog";
import { RubricGuide } from "./components/RubricGuide";
import { Sidebar } from "./components/Sidebar";
import { Workbench } from "./components/Workbench";
import { EVAL_CASES } from "./data/cases";
import { buildReport } from "./lib/report";
import { useAtelier } from "./state/useAtelier";

export function App() {
  const { store, saveOk, actions } = useAtelier();
  const [view, setView] = useState("overview");
  const [suite, setSuite] = useState("全部");
  const [reportAt, setReportAt] = useState<Date | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const visible = useMemo(
    () => EVAL_CASES.filter((item) => suite === "全部" || item.suite === suite),
    [suite],
  );
  const selected = EVAL_CASES.find((item) => item.id === view) ?? null;
  const visibleIndex = selected ? visible.findIndex((item) => item.id === selected.id) : -1;
  const prevId = visibleIndex > 0 ? visible[visibleIndex - 1].id : null;
  const nextId =
    visibleIndex >= 0 && visibleIndex < visible.length - 1 ? visible[visibleIndex + 1].id : null;

  useEffect(() => {
    document.title = selected ? `${selected.title} · 提示词评测工坊` : "总览 · 提示词评测工坊";
  }, [selected]);

  useEffect(() => {
    document.querySelector(".main")?.scrollTo({ top: 0 });
  }, [view]);

  function chooseSuite(next: string) {
    setSuite(next);
    if (view === "overview") return;
    const list = EVAL_CASES.filter((item) => next === "全部" || item.suite === next);
    if (!list.some((item) => item.id === view)) setView(list[0]?.id ?? "overview");
  }

  return (
    <>
      <a className="skip" href="#main">
        跳到内容
      </a>
      <div className="app">
        <Sidebar
          store={store}
          saveOk={saveOk}
          view={view}
          suite={suite}
          visibleIds={visible.map((item) => item.id)}
          actions={actions}
          onOpen={setView}
          onSuite={chooseSuite}
          onGuide={() => setGuideOpen(true)}
        />
        <main className="main" id="main">
          <div className="topbar">
            <div className="crumbs">
              <button type="button" onClick={() => setView("overview")}>
                总览
              </button>
              {selected ? (
                <>
                  <span aria-hidden="true">/</span>
                  <strong>
                    {selected.index} {selected.title}
                  </strong>
                </>
              ) : (
                <strong>这一轮</strong>
              )}
            </div>
            <div className="top-actions">
              <button type="button" className="btn-ghost" onClick={() => setGuideOpen(true)}>
                尺子
              </button>
              <button type="button" className="btn-primary" onClick={() => setReportAt(new Date())}>
                导出报告
              </button>
            </div>
          </div>
          {selected ? (
            <Workbench
              key={selected.id}
              evalCase={selected}
              edit={store.cases[selected.id]}
              actions={actions}
              prevId={prevId}
              nextId={nextId}
              onOpen={setView}
            />
          ) : (
            <Overview store={store} actions={actions} onOpen={setView} />
          )}
        </main>
      </div>
      {reportAt ? (
        <ReportDialog markdown={buildReport(EVAL_CASES, store, reportAt)} onClose={() => setReportAt(null)} />
      ) : null}
      {guideOpen ? <RubricGuide onClose={() => setGuideOpen(false)} /> : null}
    </>
  );
}
