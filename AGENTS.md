# AGENTS.md — splity

供 AI coding agents（Claude Code / Codex / Cursor / Copilot 等）在本仓库工作时自动读取。

## 项目概览
Splity：一张纸，写上知识点，自动分割成学习卡片。粘贴文本 → 自动识别格式拆成正反面卡片 →
3D 翻转复习（空格翻转、←→ 切换、M 标记掌握），带进度追踪与列表总览。

## 技术栈
| 层 | 方案 |
|---|---|
| 前端 | React 19 + TypeScript 6 + Vite 8 |
| 样式 | 纯 CSS，无 UI 框架 |
| Lint | oxlint |
| 数据 | 本地存储，无后端 |

## 常用命令
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```

## 约定
- 支持的分割格式：编号列表、符号列表、问答对（Q/A）、键值对、定义式、空行分段。
  **分割逻辑是产品核心**，改解析规则时必须覆盖这 6 种格式的样例，防止回归。
- 键盘交互（空格 / ←→ / M）是主要使用路径，改动组件时不要破坏。
- 技术栈细节见 `docs/TECH_STACK.md`；落地页仓库是 `splity-landing`。

## 不要做的事
- 不要引入 UI 框架（项目刻意保持纯 CSS）。
- 不要提交构建产物与 `.env`。
- 不要跳过 `git pull --rebase` 直接 push。
