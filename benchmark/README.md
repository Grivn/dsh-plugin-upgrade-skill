# dsh 插件迁移考题（benchmark v1）

6 道"插件升级"考题，测一件事：**AI 装了我们的升级 skill 之后，到底会不会真的
升级插件**。前 2 道是笔试（看代码写答案），后 4 道是实操（真的在 docker 里装
dsh、跑插件，活没活着一眼看穿）。每道题都带自动判分，不用人改卷。

每道题考的都是真坑：有的代码里埋了句"试试这样改"的误导注释（照做必死），有的
插件本来就带着一个和升级无关的坏测试（考 AI 会不会如实报告，而不是偷偷修好
装作没事）。

## 题目一览（说人话版）

| 题号 | 类型 | 考什么 |
|---|---|---|
| S1-static-scan | 笔试 | 给你一份老插件代码：能不能找全"哪里会坏"、查对说明书，而且不乱改卷子 |
| S2-negative-scan | 笔试 | 给你一份看着挺干净的代码：会不会傻乎乎说"一切正常"（没发现问题 ≠ 没问题） |
| M1-host-migration | 实操 | 老插件在新版 dsh 上启不来（真实发生过的故障），修好它 |
| H1-plane-trap | 实操 | 最难的坑：代码注释诱导你用一种必死的改法，考会不会被带偏 |
| H2-baseline-trap | 实操 | 插件带着一个本来就红的测试：考会不会如实说"这锅不是升级造成的" |
| H3-client-plane | 实操 | 网页插件少写了一条必需声明：考知不知道补上 |

每题目录统一为：`task.md`（给 AI 看的题目）、`fixture/`（题目用的插件代码，
**不能真运行、不能发布**）、`judge.mjs`（自动判分）、`solution/`（标准答案
+ 这道题在考什么）。

## 前置条件

- Docker 容器 `dsh-verify`（`node:24-bookworm`，dsh 0.1.2-alpha.2 全局安装）
  处于运行状态——M1/H1/H2/H3 的 judge 会真实进去装插件、冷启动、读日志。
  复现方式见 `validation-report-2026-08-30.md` 第六节。
- 本机有 `git`、`node`（judge 零 npm 依赖）。

## 怎么跑

```sh
# 全部题目（无 agent 输出时全部 0 分，用于自测判分器本身）
node benchmark/run.mjs --all

# 单题
node benchmark/run.mjs --task M1-host-migration --agent-output benchmark/agent-output

# 判分结果：控制台表格 + benchmark/scorecard.json
```

### 先验证考题和标准答案

评 agent 之前，维护者可先运行仓库自带的精确版本验收：

```sh
npm run test:dsh
```

它会在临时 Docker 容器中自动安装固定版本，并验证 M1 的完整红绿链：旧实现
在 `0.1.1-rc.2` 可用、在 `0.1.2-alpha.2` 因缺少 `apiProxy` 失败、M1 标准答案
在 `0.1.2-alpha.2` 真实调用 `llm` 服务成功。它不读取或修改本机 `~/.dsh`，也不要求
预先准备 `dsh-verify` 容器；定义见 [`runtime/cases.json`](runtime/cases.json)。

## 怎么给 agent 用（评测协议）

1. **给 agent 的输入**：`benchmark/tasks/<题号>/task.md` 就是用户对 agent 说的话，
   按题面原样投喂即可；题面里已指明工作目录指向 `fixture/`。
2. **agent 的落点约定**（题面里也已写明）：
   - 静态题（S1/S2）：agent 只读 fixture，把报告写到
     `benchmark/agent-output/<题号>/` 下（文件名随意，.md/.txt/.json 均可）；
   - 容器题（M1/H1/H2/H3）：agent 直接修改 `tasks/<题号>/fixture/` 里的文件；
     H2 另需把迁移报告写到 `benchmark/agent-output/H2-baseline-trap/` 下。
3. **判分**：`node benchmark/run.mjs --all`，各题 judge 输出一行 JSON
   `{"score": 0-100, "max": 100, "reasons": [...]}`，run.mjs 汇总成表格并写
   `benchmark/scorecard.json`。

### with-skill vs without-skill 对照（隔离 skill 效果）

同一批 agent、同一批题，跑两轮：

- **with-skill 轮**：把本仓库 `skills/plugin-upgrade/` 作为 skill 挂给 agent
  （题面不变）；
- **without-skill 轮**：裸 agent，只给题面。

两轮分差即 skill 的净效果。建议每轮跑 3 次取中位数（容器题有环境噪声）；
判分前用 `git checkout -- benchmark/tasks/` 恢复 fixture 到基准态。评分细则与
各题考点对照见 [docs/scoring.md](docs/scoring.md)。

## 判分设计要点

- **真激活才算过**：容器题 judge 把 agent 改后的 fixture 推进 `dsh-verify`，
  建独立 profile（`bench-m1`…）与独立 `/tmp` 插件目录，冷启动后以
  `pending (waiting for service: …)` / `plugin tree failed` / 启动推进到应用层
  作为判活信号；judge 跑完清理自建资产，不动容器里已有的 `/tmp/demo-plugin*`。
- **不依赖固定输出文本**：agent 的插件日志措辞不限，判据是宿主侧信号（如无 key
  时 headless 必输出 `MISSING_CREDENTIAL`，证明插件树已整体激活）。
- **错误容忍**：缺 `--agent-output`、容器不在、git 异常都按 0 分处理并在
  reasons 里说明，judge 自身永远 exit 0。

## 给维护者的注意事项（不改题不用看）

- 每道题 `fixture/` 里的假插件，package.json 都写着 `"private": true`，
  它的 README 也注明了"只是考题素材，不许发布"。**新增题目时保持这两条**，
  目的是防止有人不小心把这些假插件发到 npm 上——它们运行不了，发出去只会
  污染环境。
- 在 benchmark 的 Markdown 里引用升级卡时，要写完整编号（如
  `DSH-0.1.2-A1-01`，不能简写成"A1-01"）。仓库自检会查两件事：这个编号
  真实存在、链接点得开；写错的话 `node scripts/validate.mjs` 会直接报错。
