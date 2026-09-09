# 技术栈 — splity

更新时间：2026-09-09

## 概览
一张纸，写上知识点，自动分割成学习卡片：粘贴文本 → 自动识别格式拆成正反面卡片 → 3D 翻转复习
（空格翻转、←→ 切换、M 标记掌握），带进度追踪与列表总览。

## 技术选型
| 层 | 选型 |
|---|---|
| 前端 | React 19 + TypeScript 6 + Vite 8 |
| 样式 | 纯 CSS，无 UI 框架 |
| 数据持久化 | 本地（无后端依赖） |
| Lint | oxlint |

## 常用命令
```bash
npm install     # 安装依赖
npm run dev     # 开发服务器（默认 http://localhost:5173）
npm run build   # tsc -b + vite build
npm run lint    # oxlint
npm run preview # 预览构建产物
```

## 支持的分割格式
编号列表、符号列表、问答对（Q/A）、键值对、定义式、空行分段。

## 注意点
- 分割逻辑是产品核心，改解析规则时优先补样例文本覆盖上述 6 种格式，避免回归。
- 无后端，数据存本地；若将来加同步，需先明确存储与冲突策略。
- 项目约定见根目录 `README.md` 与 `handoff.md`。
