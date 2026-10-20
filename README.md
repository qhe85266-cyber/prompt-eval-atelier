# 提示词评测工坊

Prompt Eval Atelier. 给产品经理用的提示词评测工作台。

同一份材料，两份提示词，三把尺子：**清晰度**、**依据性**、**合规**。分数和通过与否可以改，结论可以和规则不一致，最后导出一份 Markdown 评测报告。

不需要 API key。样例输出是仓库里的固定文本，用来讨论评测设计，而不是现场抽模型。

## 跑起来

```bash
npm install
npm run dev
```

浏览器打开终端里给出的本地地址。生产构建：

```bash
npm run build
npm run preview
```

`npm run build` 会做类型检查、规则自检，再打包。

## 仓库里有什么

| 路径 | 作用 |
| --- | --- |
| `src/data/cases.ts` | 7 个固定案例：提示词 A/B、样例输出、基线分和审阅标记 |
| `src/lib/verdict.ts` | 通过、待定、不通过，以及规则倾向 |
| `src/lib/report.ts` | Markdown 报告 |
| `使用说明书.md` | 怎么操作，以及面试时怎么讲指标和迭代 |

界面是中文。修改保存在这台浏览器里，可以随时恢复示例基线。

## 许可

[MIT](LICENSE)
