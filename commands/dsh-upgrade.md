---
description: 升级 DSH 插件到指定版本
---

调用 plugin-upgrade skill 升级当前仓库的 DSH 插件。

目标版本从 `$ARGUMENTS` 读取（如 `0.1.2`）。未指定时先探测已安装版本并询问目标版本。

按 skill 的宿主版本迁移流程：先输出触点扫描结果与迁移计划，确认后再改代码。
