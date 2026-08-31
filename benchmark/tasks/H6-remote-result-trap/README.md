# H6-remote-result-trap · Remote failure semantics trap (read-only Markdown diagnosis)

agent 诊断一段"看起来很稳但错"的 alpha.2 Remote 消费代码：unary 普通业务失败
走 `RemoteResult` 的 `ok: false` 而非 reject，旧代码却 blanket try/catch +
`instanceof RemoteError` + 旧裸码 + 一律 retry。陷阱：fixture 顶部同事建议
"wrap every remote call in try/catch and retry whenever a RemoteError occurs"。
考点与迁移规则见卡片 [DSH-0.1.2-A2-02](../../../skills/plugin-upgrade/references/v0.1.2-alpha.2.md)、
ledger [API-02](../../../skills/plugin-upgrade/references/api-migration-0.1.2-alpha.2.md) 与
[rollup「Remote call error flow」](../../../skills/plugin-upgrade/references/rollup-0.1.2.md)。

题面见 [instruction.md](instruction.md)，判分逻辑见 [tests/judge.mjs](tests/judge.mjs)。

- **环境**：`node:24-bookworm` + git（fixture 以 git 基线提交支持只读门禁），不装 dsh（本题纯诊断）。
- **Verifier**：judge 按六个规范 Markdown section 分区判分（Root Cause 20 / Problems 10 /
  Corrected Implementation 20 / Error Code Migration 20 / Retry Policy 15 / Error Boundary 15），
  Corrected Implementation 只检查 fenced 代码块；方向感知 + 四条 cap；0-100 归一化写
  `/logs/verifier/reward.txt`。
- **Oracle**：`harbor run -p benchmark/tasks/H6-remote-result-trap -a oracle`，期望 reward 1.0。

## 负控（不依赖模型 API）

| 负控 | 做法 | 期望 reward |
|---|---|---|
| A · no report | 不写报告跑 verifier | 0 |
| B · keyword stuffing | 含 RemoteResult/result.ok/isRemoteFailure 等词但无六个规范 section | ≤ 0.20 |
| C · bare legacy codes in fix | 诊断正确但修复代码仍 `case 'cancelled'` | ≤ 0.60 |
| D · blanket retry in fix | 修复代码对 cancelled/internal/default 一律 retry | ≤ 0.60 |
| E · wrong throw/catch model | Root Cause 主张"ordinary remote failures throw，用 try/catch 处理" | ≤ 0.30 |
| F · instanceof fix | 修复代码以 instanceof RemoteError 为主判别 | ≤ 0.60 |
| G · oracle | solution/report.md | 1.00 |
| H · honest quoting | 散文/行内引用旧码 + 修复代码正确（防假阳性） | ≥ 0.90 |

```
environment/fixture/   # 只读 fixture：错误迁移的 session-rename helper（含同事建议注释）
tests/                 # judge.mjs + judge-utils.mjs + test.sh
solution/              # 六 section 参考报告 + solve.sh
```
