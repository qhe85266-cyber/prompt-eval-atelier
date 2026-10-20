import { useCallback, useEffect, useMemo, useState } from "react";
import { createDefaultStore } from "../lib/defaults";
import { loadStore, saveStore } from "../lib/storage";
import { suggestVerdict } from "../lib/verdict";
import type {
  AnnotationStore,
  CaseEdit,
  Decision,
  RubricKey,
  VariantId,
  Verdict,
} from "../types";

export interface AtelierActions {
  setScore: (caseId: string, variant: VariantId, key: RubricKey, score: number) => void;
  setScoreNote: (caseId: string, variant: VariantId, key: RubricKey, note: string) => void;
  setVerdict: (caseId: string, variant: VariantId, verdict: Verdict) => void;
  followRule: (caseId: string, variant: VariantId) => void;
  setPmNote: (caseId: string, variant: VariantId, note: string) => void;
  setDecision: (caseId: string, decision: Decision) => void;
  setDecisionNote: (caseId: string, note: string) => void;
  setReviewer: (name: string) => void;
  setRoundNote: (note: string) => void;
  resetCase: (caseId: string) => void;
  resetAll: () => void;
}

export function useAtelier(): {
  store: AnnotationStore;
  saveOk: boolean;
  actions: AtelierActions;
} {
  const [store, setStore] = useState<AnnotationStore>(() => loadStore());
  const [saveOk, setSaveOk] = useState(true);

  useEffect(() => {
    setSaveOk(saveStore(store));
  }, [store]);

  const patch = useCallback((caseId: string, recipe: (draft: CaseEdit) => void) => {
    setStore((prev) => {
      if (!prev.cases[caseId]) return prev;
      const next = structuredClone(prev);
      recipe(next.cases[caseId]);
      return next;
    });
  }, []);

  const actions = useMemo<AtelierActions>(
    () => ({
      setScore(caseId, variant, key, score) {
        const nextScore = Math.max(1, Math.min(5, Math.round(score)));
        patch(caseId, (draft) => {
          const target = draft.variants[variant];
          target.scores[key].score = nextScore;
          if (!target.verdictTouched) target.verdict = suggestVerdict(target.scores);
        });
      },
      setScoreNote(caseId, variant, key, note) {
        patch(caseId, (draft) => {
          draft.variants[variant].scores[key].note = note.slice(0, 800);
        });
      },
      setVerdict(caseId, variant, verdict) {
        patch(caseId, (draft) => {
          draft.variants[variant].verdict = verdict;
          draft.variants[variant].verdictTouched = true;
        });
      },
      followRule(caseId, variant) {
        patch(caseId, (draft) => {
          const target = draft.variants[variant];
          target.verdict = suggestVerdict(target.scores);
          target.verdictTouched = false;
        });
      },
      setPmNote(caseId, variant, note) {
        patch(caseId, (draft) => {
          draft.variants[variant].pmNote = note.slice(0, 800);
        });
      },
      setDecision(caseId, decision) {
        patch(caseId, (draft) => {
          draft.decision = decision;
        });
      },
      setDecisionNote(caseId, note) {
        patch(caseId, (draft) => {
          draft.decisionNote = note.slice(0, 2000);
        });
      },
      setReviewer(name) {
        setStore((prev) => ({ ...prev, reviewer: name.slice(0, 40) }));
      },
      setRoundNote(note) {
        setStore((prev) => ({ ...prev, roundNote: note.slice(0, 2000) }));
      },
      resetCase(caseId) {
        setStore((prev) => {
          const fresh = createDefaultStore();
          if (!fresh.cases[caseId]) return prev;
          const next = structuredClone(prev);
          next.cases[caseId] = fresh.cases[caseId];
          return next;
        });
      },
      resetAll() {
        setStore((prev) => {
          const fresh = createDefaultStore();
          fresh.reviewer = prev.reviewer;
          fresh.roundNote = prev.roundNote;
          return fresh;
        });
      },
    }),
    [patch],
  );

  return { store, saveOk, actions };
}
