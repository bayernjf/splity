# Splity 代码深度评审报告

- 评审日期：2026-11-02
- 评审方式：只读静态评审 + 验证门实际执行 + parser 实证测试（未修改任何源码，未执行 git commit/push）
- 评审基线：`dev` 分支 @ `9a9fbda`（工作区干净，无未提交改动）

## 一、仓库定位与规模概览

Splity 是一个纯前端学习卡片工具：粘贴知识点文本 → 多策略解析拆成正反面卡片 → 3D 翻转复习。无后端、无数据库、无状态持久化（刷新即丢）。

| 项 | 值 |
|---|---|
| 语言 | TypeScript + CSS（React 19.2.8 / Vite 8.2.0 / TS 6.0.2） |
| 源码文件 | 6 个（`src/` 下 5 个 ts/tsx/css + `index.html` 入口） |
| 代码规模 | src 共 1,140 行（`parser.ts` 249 / `CardView.tsx` 160 / `InputPage.tsx` 62 / `App.tsx` 29 / `main.tsx` 10 / `index.css` 590） |
| 构建产物 | JS 198 KB（gzip 62.9 KB）+ CSS 8.16 KB，单 chunk |
| 测试文件 | 0 个（`find` 实测无 `*.test.*` / `*.spec.*`） |
| CI | 无（无 `.github/`、`.gitlab-ci.yml`、`.circleci`） |
| 依赖 | 运行时依赖仅 react / react-dom；`node_modules` 已安装 |

## 二、结论摘要

计数：**P0 = 0，P1 = 3，P2 = 5，P3 = 4**。

最关键的 3 条：

1. **P1 — 核心功能 bug：Q/A 格式（含中文 问：/答：）永远被键值对策略劫持**，产出 `front="Q"` / `front="问"` 的废卡片（实证，见 P1-1）。README 主打的 6 种格式中有 1 种实际不可用。
2. **P1 — `index.css` 第 480 行起追加的第二套 `:root`/`#root` 样式覆盖原设计系统**：输入框文字被居中、暗色模式半残（白卡片 + 浅灰字）、rem 基准从 16px 变 18px（实证，见 P1-2）。`handoff.md` 已记录但至今未修。
3. **P1 — 产品核心 parser 零测试、零 CI**：`AGENTS.md:28` 明确要求"改解析规则时必须覆盖 6 种格式样例"，但仓库没有任何测试机制和流水线，P1-1 的 bug 正是漏网证据（见 P1-3）。

## 三、逐条发现

### 1. 整体架构与模块边界

架构简单清晰：`App.tsx` 做视图切换（input ↔ cards），`lib/parser.ts` 为纯函数多策略解析器，两个组件各管一页。模块边界合理，无循环依赖，无过度设计。唯一结构性问题是样式层（见 P1-2）与验证层缺失（见 P1-3）。

### 2. 正确性与潜在 bug

#### P1-1 Q/A 解析格式被 parseKeyValue 劫持（核心功能 bug）

- 位置：`src/lib/parser.ts:23-49`（"产出卡片最多者胜出"竞争机制）+ `src/lib/parser.ts:130-151`（`parseKeyValue`）
- 证据（实测，`node --experimental-strip-types` 直接调用 `parseToCards`）：
  - 输入 `Q: ...\nA: ...`（2 组问答）→ 产出 **4 张卡**，首张 `{front:"Q", back:"什么是光合作用？"}`
  - 输入 `问：...\n答：...`（2 组）→ 4 张卡，首张 `{front:"问", ...}`
  - 输入 3 组 `Q:/A:` → 6 张卡，fronts 为 `["Q","A","Q","A","Q","A"]`
- 根因：`parseQA` 正确产出 2 张卡，但每一行 `Q: xxx` / `A: yyy` 同时命中 `kvPattern`（`parser.ts:134`），`parseKeyValue` 产出 4 张卡；竞争机制取多者（`parser.ts:35`），KeyValue 恒胜（KV 卡数 = 2×QA 卡数）。
- 影响：README「功能」一节宣称支持的"问答对（Q/A）"格式完全不可用，且失败方式有迷惑性——用户会得到数量翻倍、内容错乱的卡片。
- 修复建议：策略增加优先级/权重（如 `parseQA` 命中 ≥1 组即直接返回），或让 `kvPattern` 排除 `Q/A/问/答/问题/答案` 等保留键；修复后补 6 格式回归测试。

#### P3-3 解析产出 0 张卡时用户无任何反馈

- 位置：`src/App.tsx:12-18` —— `parsed.length > 0` 才切换视图，否则静默忽略点击。
- 影响：文本无法识别时用户点「✂️ 分割成卡片」毫无反应，不知是 bug 还是格式问题。
- 修复建议：增加"未识别到卡片，请检查格式"的轻提示。

### 3. 安全

纯本地静态前端，无认证、无网络请求、无后端，攻击面极小。

- 无 `dangerouslySetInnerHTML` / `eval` / `innerHTML` 使用（`grep` 无命中），卡片文本由 React 转义渲染，无 XSS 注入点。
- 无密钥/凭证入库：`grep -rIl -E "(api[_-]?key|secret|token|password)"`（排除 node_modules/.git）无命中；无 `.env*` 文件。
- `npm audit` 报 3 个 high（见 P2-3），均为 Vite **开发服务器**问题，不影响静态产物。
- 结论：**P0 = 0**。

### 4. 数据模型与迁移一致性

- 数据模型仅 `FlashCard` 接口（`src/lib/parser.ts:1-6`），内存态，无持久化、无 schema 演化问题。
- **P2-4 迁移约定空转**：`MIGRATION_CONVENTION.md` 与 `tools/check-migrations.sh` 齐备，但仓库无 `supabase/migrations` 或 `db/migrations` 目录，脚本未接入任何 npm script 或 CI；直接运行脚本会因"无迁移目录"exit 1（`tools/check-migrations.sh:38-39`）。纯前端仓库保留数据库迁移约定属于误导性死文档。
- 修复建议：移除或标注"预留"；若保留则将脚本挂入 CI。

### 5. 错误处理与失败模式

- parser 各策略对空输入/不匹配输入返回 `[]`，链路安全；`App.tsx:14` 阻止空卡组进入学习页，`CardView` 不会收到空数组（`cards[0]` 取值安全）。
- 唯一失败模式缺陷即 P3-3（静默失败无反馈）。无网络/IO，无其他失败面。

### 6. 测试覆盖与验证门真实性

#### P1-3 零测试、零 CI，验证门只有 lint + build

- 证据：`package.json:6-11` 无 `test` 脚本；全仓 `find` 无测试文件；无 CI 配置目录。
- `AGENTS.md:28` 规定"改解析规则时必须覆盖这 6 种格式的样例，防止回归"，但没有任何机制落实该规定——P1-1 的 QA 劫持 bug 即实证漏网后果。
- lint / build 门是真实的（本次评审实际运行通过，见第五节），但它们无法发现逻辑错误：`tsc` 不检查正则语义，oxlint 仅报风格。
- 修复建议：引入 vitest，为 `parseToCards` 建 6 格式 + 边界样例的快照/断言测试；哪怕只加一个 `npm test` 本地脚本也比现状强。

### 7. 依赖与构建健康

- 依赖极少且均为官方主流包；`package-lock.json` 存在并与 `package.json` 一致，`npm ci` 可复现。
- **P2-3 `npm audit` 报 3 个 high severity 漏洞**（实测输出）：均为 `vite` 开发服务器问题（含 `?vite-wasm-instance` 暴露 `server.fs` 之外文件，GHSA-vfpm-58rq-9qcg），`npm audit fix` 可修。影响限于本地 dev 时同机恶意页面读取本机文件，不影响构建产物；仍建议升级。
- `typescript ~6.0.2`、`vite ^8.2.0` 属激进新版本，但 `tsc -b && vite build` 实测通过（1.28s，19 modules）。

### 8. 性能

- 无明显热点。解析为 6 个策略各扫一遍文本（O(策略数 × 文本长度)），输入规模为人手粘贴的笔记，可忽略。
- 产物单 chunk 198 KB（gzip 62.9 KB），对此体量应用可接受；React 占绝大部分。
- `CardView.tsx:20-30` 的 `setTimeout(150ms)` 未在卸载时清理：React 18+ 对卸载后 setState 不再告警，且使用函数式更新，实际无害，仅作记录。

### 9. 文档与实现一致性

- `README.md` 功能描述与实现一致，但"问答对"格式实际不可用（P1-1），文档与行为不符。
- `handoff.md:64-79` 记录的 CSS 冲突与模板残留**属实且仍未修复**（本次逐条复核确认，见 P1-2 / P2-5）。
- `README.md:30-40` 项目结构图未列 `src/assets/`（残留文件所在），**P3-4** 轻微不一致。
- `MIGRATION_CONVENTION.md` 与仓库实际（无数据库）不符（P2-4）。

#### P1-2 `index.css` 追加样式块破坏原设计系统（`handoff.md` 已知问题，复核确认）

- 位置：`src/index.css:480-590`（第二套 `:root`、`#root`、全局 `h1/h2/p`）
- 逐条实测依据：
  - `:root` 重复定义 `--text/--bg/--border/--shadow`（`index.css:481-491` vs `index.css:6-11`），后者全赢，原配色失效。
  - `#root { text-align: center }`（`index.css:536`）+ `.paper-input` 未设 `text-align`（`index.css:95-107`）→ **textarea 输入文字被居中**（继承链确凿）。
  - `:root { font: 18px/145% ... }`（`index.css:497`）把 rem 基准从 16px 改为 18px，全站 rem 尺寸放大 12.5%（h1、卡片、按钮全部受影响）。
  - 暗色模式块（`index.css:512-530`）只覆盖部分变量，`--surface: #ffffff`（`index.css:7`）不变 → 暗色下白卡片配浅灰字（`--text: #9ca3af`），对比度不足；`#social .button-icon`（`index.css:527-529`）选择器在本项目无任何对应元素，属死代码。
- 影响：用户可见的显示回归（输入居中、暗色模式破碎、尺寸漂移）。
- 修复建议：按 `handoff.md` 方案将暗色能力并入原变量体系，删除 480 行后的整块冲突代码。

#### P2-1 键盘处理器劫持按钮的 Enter/Space 激活（可访问性）

- 位置：`src/components/CardView.tsx:44-58`
- 机制：`.card-view` 容器上的 `onKeyDown` 对 Space/Enter 一律 `preventDefault()` 并翻转卡片。当焦点在「标记掌握」「上一张」等按钮上时，Enter/Space 的按钮默认激活被取消，按键变成翻卡——键盘用户无法用 Enter/Space 触发聚焦按钮。
- 修复建议：判断 `e.target` 是否为按钮时跳过翻卡逻辑，或把快捷键挂到 `document` 并排除交互元素。

#### P2-2 「返回编辑」后原始文本丢失

- 位置：`src/App.tsx:9-10` + `src/components/InputPage.tsx:14`
- 机制：`InputPage` 的 `text` 是组件内 state，切换到卡片视图即卸载；点击「← 返回编辑」后文本框为空，与按钮文案承诺的"编辑"不符。`handoff.md` 已将持久化列为待办，但文本提升（lifting state）是低成本前置修复。
- 修复建议：把 `text` 提升到 `App`，或按待办做 localStorage 持久化。

#### P2-5 未引用的模板残留资源

- 证据：`grep` 全仓无引用 —— `src/assets/hero.png`（13 KB）、`src/assets/react.svg`、`src/assets/vite.svg`、`public/icons.svg`（5 KB）。`hero.png` 未被 import，不会进产物；`public/icons.svg` 会被原样拷入 dist。
- 修复建议：按 `handoff.md` 待办删除。

#### P3-1 `index.html` 语言声明与内容不符

- 位置：`index.html:2` `lang="en"`，但 UI 全文为中文；同时缺 `<meta name="description">`。
- 影响：屏幕阅读器发音语言错误、SEO 摘要不全。
- 修复建议：改 `lang="zh-CN"` 并补 description。

#### P3-2 oxlint 风格警告

- 位置：`src/lib/parser.ts:158` —— `[—–\-]` 中 `-` 多余转义（lint 实测输出 `eslint(no-useless-escape)`）。
- 修复建议：改为 `[—–-]`。

## 四、验证门实际执行结果

| 门 | 命令 | 结果 |
|---|---|---|
| Lint | `npm run lint`（oxlint 1.75.0） | **通过**：exit 0，6 文件 / 104 规则，0 errors / 1 warning（P3-2） |
| 类型 + 构建 | `npm run build`（`tsc -b && vite build`） | **通过**：exit 0，19 modules，JS 198 KB（gzip 62.9 KB）/ CSS 8.16 KB，1.28s，无 chunk 警告 |
| 单元测试 | 不存在 | **无法执行**：`package.json` 无 test 脚本，无测试文件，无测试框架依赖 |
| E2E | 不存在 | 无 Playwright/Cypress 配置 |
| CI | 不存在 | 无 `.github/` 等流水线配置 |
| 依赖审计 | `npm audit` | **3 high**（vite dev server，P2-3），`npm audit fix` 可修 |
| parser 实证 | `node --experimental-strip-types` 直调 `parseToCards` | 编号/符号/键值/定义/分段 5 种格式正确；**Q/A 格式错误**（P1-1） |

说明：执行 build 会在仓库生成 `dist/` 产物目录（已被 `.gitignore:11` 忽略，非受控文件）；此外未写入/修改仓库内任何文件。

## 五、修复优先级建议

1. **先修 P1-1**（parser 竞争机制）并同时落地 P1-3 的最小测试集——两者是同一笔工作：为 6 种格式各加一条样例断言即可同时封堵回归。
2. **再修 P1-2**（删除 `index.css:480-590` 冲突块），消除输入居中与暗色破碎两个用户可见回归。
3. 跟进 P2：`npm audit fix` 升级 vite（P2-3）→ CardView 键盘 a11y（P2-1）→ 文本状态提升（P2-2）→ 清理残留资源（P2-5）与空转迁移约定（P2-4）。
4. P3 随下次提交顺手处理（lang/description、无用转义、README 结构图、空解析提示）。
