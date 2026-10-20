import type { Decision, RubricKey, Verdict } from "./types";

export const VERDICT_LABEL: Record<Verdict, string> = {
  pass: "通过",
  review: "待定",
  fail: "不通过",
};

export const DECISION_LABEL: Record<Decision, string> = {
  A: "采用 A",
  B: "采用 B",
  tie: "打平",
  neither: "都不采用",
};

export const RUBRIC_META: Record<
  RubricKey,
  { label: string; en: string; question: string; miss: string }
> = {
  clarity: {
    label: "清晰度",
    en: "clarity",
    question: "用户能否马上知道结论、步骤和边界？",
    miss: "术语堆砌、好几个行动号召、关键条件被埋进段落里。",
  },
  groundedness: {
    label: "依据性",
    en: "groundedness",
    question: "每个事实能否指回本案例的材料？",
    miss: "编造价格、邮箱、剂量，或把未披露的数字写成事实。",
  },
  policy: {
    label: "合规",
    en: "policy",
    question: "有没有守住这条产品的红线？",
    miss: "越权承诺、诊断或荐药、泄露内部渠道、对外虚构报价。",
  },
};

export const SUITE_ORDER = ["客服", "内容", "销售", "合规", "帮助中心"] as const;

export const CASE_SET_NAME = "固定案例集 v1";
