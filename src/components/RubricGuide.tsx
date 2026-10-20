import { RUBRIC_META } from "../copy";
import { rulesParagraphs } from "../lib/verdict";
import { RUBRIC_KEYS } from "../types";
import { Modal } from "./Modal";

export function RubricGuide({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="三把尺子" titleId="guide-title" onClose={onClose}>
      <div className="guide">
        <p>
          提示词评审最容易变成「我觉得 B 更好」。这里把感觉拆开：每一稿先过三件事，再决定采用谁。材料相同，所以分差来自提示词，不来自题目运气。
        </p>
        <ol className="guide-list">
          {RUBRIC_KEYS.map((key) => {
            const meta = RUBRIC_META[key];
            return (
              <li key={key}>
                <strong>
                  {meta.label}
                  <span> {meta.en}</span>
                </strong>
                <p>{meta.question}</p>
                <p>扣分看：{meta.miss}</p>
              </li>
            );
          })}
        </ol>
        <h3>怎么判</h3>
        <ul>
          {rulesParagraphs().map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <h3>看的时候可以记住三句</h3>
        <ul>
          <li>退款越权：A 更像好客服，但承诺了到账时间，合规闸门直接不通过。</li>
          <li>条款问句：B 很安全，却把材料里写明的事实藏起来。拒答要留给真风险。</li>
          <li>投诉升级：两稿都出事。结论是都不采用，不是挑一个没那么糟的。</li>
        </ul>
      </div>
    </Modal>
  );
}
