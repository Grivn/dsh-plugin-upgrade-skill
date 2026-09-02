# Do Migration Skills Actually Help? A Community-Grounded Benchmark for Skill-Guided Framework Migration

[English README](README.md)

本目录是 dsh plugin-upgrade skill 有效性的技术报告。报告研究 skill（推理时加载的程序性知识文档）在框架迁移场景中的真实效用：基于 dsh 插件生态中社区上报的 24 个经核实的迁移失败案例，构建配对评测 benchmark，测量 skill 的收益分布、对误导性上下文的鲁棒性、temporal holdout 泛化与 over-trust 失败模式。

## 目录结构

- `latex/` — 报告 LaTeX 源码
  - `acl_latex.tex` — 主文件（标题、作者、摘要、全文骨架；基于官方最新模板）
  - `acl.sty` / `acl_natbib.bst` — ACL 官方样式（acl-org/acl-style-files master，2026-06 版）
  - `custom.bib` — 参考文献（含待核实的 stub 条目，见文件内 TODO）
  - `formatting.md` — 官方格式说明
  - `acl_lualatex.tex` — XeLaTeX / LuaLaTeX 模板（未使用）
- `word/`、`archive/` — 官方 Word 模板与历史模板（本文未使用，随官方样式包保留）

## 编译

```bash
cd latex
pdflatex acl_latex && bibtex acl_latex && pdflatex acl_latex && pdflatex acl_latex
```

或直接上传 `latex/` 目录到 [Overleaf](https://www.overleaf.com/) 编译。当前使用 `review` 模式（带行号）。

## 写作状态

- [x] 标题 / 作者 / 摘要
- [x] 章节骨架（§1–§8 + Limitations + Ethics + 附录）
- [x] Introduction 初稿（community-grounded 四段式）
- [ ] 实验数字回填（正文 `[N]` / `[X]` 占位，搜索 `% TODO`）
- [ ] Figure 1–3、Table 1–5 占位替换为正式图表
- [ ] `custom.bib` stub 条目逐条核实替换
- [ ] §3–§5、§6–§7 正式文字

## 相关资源

- Benchmark 任务与判分：`../benchmark/`
- Skill 语料：`../skills/`
- 官方样式来源：[acl-org/acl-style-files](https://github.com/acl-org/acl-style-files)
