export const RUBRIC_KEYS = ["clarity", "groundedness", "policy"] as const;

export type RubricKey = (typeof RUBRIC_KEYS)[number];

export type VariantId = "A" | "B";

export type Verdict = "pass" | "review" | "fail";

export type Decision = "A" | "B" | "tie" | "neither";

export interface RubricScore {
  score: number;
  note: string;
}

export type RubricScores = Record<RubricKey, RubricScore>;

export interface Mark {
  text: string;
  tone: "risk" | "good";
}

export interface Evidence {
  title: string;
  body: string;
}

export interface FixtureVariant {
  id: VariantId;
  name: string;
  hypothesis: string;
  prompt: string;
  output: string;
  scores: RubricScores;
  verdict: Verdict;
  pmNote: string;
  marks: Mark[];
}

export interface EvalCase {
  id: string;
  index: string;
  title: string;
  suite: string;
  product: string;
  risk: string;
  userInput: string;
  intent: string;
  evidence: Evidence[];
  iterationLever: string;
  variants: Record<VariantId, FixtureVariant>;
  defaultDecision: Decision;
  defaultDecisionNote: string;
}

export interface VariantEdit {
  scores: RubricScores;
  verdict: Verdict;
  verdictTouched: boolean;
  pmNote: string;
}

export interface CaseEdit {
  variants: Record<VariantId, VariantEdit>;
  decision: Decision;
  decisionNote: string;
}

export interface AnnotationStore {
  version: 1;
  reviewer: string;
  roundNote: string;
  cases: Record<string, CaseEdit>;
}
