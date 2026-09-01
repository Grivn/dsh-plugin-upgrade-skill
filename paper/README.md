# Do Migration Skills Actually Help? A Community-Grounded Benchmark for Skill-Guided Framework Migration

[中文说明](README.zh.md)

This directory holds the technical report on the effectiveness of the dsh plugin-upgrade skills. The report studies whether skills---procedural-knowledge documents loaded at inference time---actually help in framework migration: we build a paired-evaluation benchmark from 24 community-reported, verified plugin-migration failures in the dsh plugin ecosystem, and measure the distribution of skill gains, robustness to misleading context, temporal-holdout generalization, and over-trust failure modes.

## Directory structure

- `latex/` — LaTeX source of the report
  - `acl_latex.tex` — main file (title, authors, abstract, full section skeleton; based on the latest official template)
  - `acl.sty` / `acl_natbib.bst` — official ACL style (acl-org/acl-style-files master, 2026-06)
  - `custom.bib` — bibliography (contains stub entries to be verified; see TODOs in the file)
  - `formatting.md` — official formatting guidelines
  - `acl_lualatex.tex` — XeLaTeX / LuaLaTeX template (unused)
- `word/`, `archive/` — official Word template and legacy templates (unused, kept as shipped with the style package)

## Build

```bash
cd latex
pdflatex acl_latex && bibtex acl_latex && pdflatex acl_latex && pdflatex acl_latex
```

Or upload the `latex/` directory to [Overleaf](https://www.overleaf.com/). The document currently uses `review` mode (with line numbers).

## Writing status

- [x] Title / authors / abstract
- [x] Section skeleton (§1–§8 + Limitations + Ethics + appendices)
- [x] Introduction draft (community-grounded, four paragraphs)
- [ ] Fill in experimental numbers (`[N]` / `[X]` placeholders in the text; search `% TODO`)
- [ ] Replace Figure 1–3 and Table 1–5 placeholders with final figures/tables
- [ ] Verify and replace stub entries in `custom.bib`
- [ ] Draft §3–§5 and §6–§7

## Related resources

- Benchmark tasks and graders: `../benchmark/`
- Skill corpus: `../skills/`
- Official style source: [acl-org/acl-style-files](https://github.com/acl-org/acl-style-files)
