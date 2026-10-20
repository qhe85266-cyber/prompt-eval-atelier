import { DECISION_LABEL, VERDICT_LABEL } from "../copy";
import type { Decision, Verdict } from "../types";

export function VerdictPill({
  verdict,
  prefix,
}: {
  verdict: Verdict;
  prefix?: string;
}) {
  return (
    <span className={`pill pill-${verdict}`}>
      {prefix ? `${prefix} ` : ""}
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function DecisionSeal({ decision }: { decision: Decision }) {
  return (
    <div className={`seal seal-${decision}`}>
      <span>{DECISION_LABEL[decision]}</span>
    </div>
  );
}
