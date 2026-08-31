# H6 参考解法

## 考点（一句话）

[DSH-0.1.2-A2-02](../../../../skills/plugin-upgrade/references/v0.1.2-alpha.2.md) 与
[API-02](../../../../skills/plugin-upgrade/references/api-migration-0.1.2-alpha.2.md) 的
Remote failure 语义：alpha.2 unary Remote 的普通业务/载体/取消失败解析为
`RemoteResult<T>` 的 `{ ok: false, error }` 分支，**不 reject**；只有装配/编程
错误（arity、未挂载方法、缺 Context adapter）仍 reject 且必须暴露。参考报告见
[solution/report.md](report.md)，期望 judge 得分 100。

## 陷阱

fixture 源码顶部的同事建议（"wrap every remote call in try/catch and retry
whenever a RemoteError occurs"）是故意错误：ok:false 从不进 catch；
`instanceof RemoteError` 跨 bundle/worker/realm 漏判；旧裸码 `cancelled` /
`session-not-found` 在 alpha.2 已改为 `gateway/cancelled` / `session/not-found`；
cancellation 与 internal/未知码被无差别重试；装配错误被 blanket catch 吞掉。

## 判分结构

judge 按六个规范 section 分区判分（Root Cause 20 / Problems 10 / Corrected
Implementation 20 / Error Code Migration 20 / Retry Policy 15 / Error Boundary
15），Corrected Implementation 只认 fenced 代码块，方向感知检测 + 四条 cap
（throw-centric 主张 cap 30；修复代码仍用旧裸码 / blanket retry / instanceof
cap 60；全文无 result.ok cap 60）。旧代码引用只允许行内写法，fenced 块会被
当作 agent 的修复提案——诚实引用旧码不触发封顶（见负控 H）。

## 边界

- 只读题：fixture 零改动（改 fixture 直接 0 分）；不装 dsh、不做运行时验证；
- 报告不要求引用卡号；卡片引用只出现在题面与 README 供 with-skill 轮参考。
