import { useState } from "react";
import { copyText, downloadText } from "../lib/download";
import { REPORT_FILENAME } from "../lib/report";
import { Modal } from "./Modal";

export function ReportDialog({
  markdown,
  onClose,
}: {
  markdown: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  async function onCopy() {
    const ok = await copyText(markdown);
    setCopied(ok ? "ok" : "fail");
  }

  return (
    <Modal title="评测报告" titleId="report-title" onClose={onClose} wide>
      <div className="report-actions">
        <button type="button" className="btn-primary" onClick={() => downloadText(REPORT_FILENAME, markdown)}>
          下载 Markdown
        </button>
        <button type="button" className="btn-ghost" onClick={() => void onCopy()}>
          {copied === "ok" ? "已复制" : copied === "fail" ? "复制失败" : "复制 Markdown"}
        </button>
        <p>文件名 {REPORT_FILENAME}。样例输出会原样写进报告。</p>
      </div>
      {copied === "fail" ? <p className="rule-line diverged">剪贴板不可用，请从下面的文本里手动复制。</p> : null}
      <pre className="report-pre">{markdown}</pre>
    </Modal>
  );
}
