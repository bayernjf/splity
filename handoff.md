# Splity - 项目交接文档

## 项目简介

**Splity** 是一个学习工具 Web 应用：用户在"一张纸"上写下知识点，系统自动智能分割成学习卡片（flashcard），支持翻转复习、标记掌握进度。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| Lint | oxlint |
| 样式 | 纯 CSS（无预处理器） |
| 状态管理 | React useState（无外部状态库） |

## 常用命令

```bash
npm run dev       # 启动开发服务器 (localhost:5173)
npm run build     # 生产构建 (tsc -b && vite build)
npm run lint      # oxlint 代码检查
npm run preview   # 预览构建产物
```

## 项目结构

```
src/
├── main.tsx              # 入口，挂载 App
├── App.tsx               # 主组件，视图切换 (input ↔ cards)
├── index.css             # 全局样式（⚠️ 存在冲突，见下方）
├── lib/
│   └── parser.ts         # 核心：智能文本分割引擎
├── components/
│   ├── InputPage.tsx     # 输入页面（文本框 + 示例）
│   └── CardView.tsx      # 卡片学习 + 列表视图
└── assets/               # 模板残留资源（可清理）
```

## 核心模块说明

### parser.ts — 智能分割引擎

导出 `parseToCards(text: string): FlashCard[]`，采用**多策略竞争**机制：

1. **parseQA** — 问答对（Q:/A:、问：/答：）
2. **parseNumberedList** — 编号列表（1. / 1、/ ①）
3. **parseBulletList** — 符号列表（- / * / •）
4. **parseKeyValue** — 键值对（key: value / key：value）
5. **parseDefinition** — 定义式（term —— definition）
6. **parseParagraphs** — 空行分段
7. **parseSentences** — 按句子分割（兜底）

选择产出卡片数最多的策略。每个条目再通过 `splitItemToCard` 拆分正反面（冒号 > "是" > 破折号）。

### CardView.tsx — 学习界面

- 3D 翻转卡片（CSS transform rotateY）
- 键盘快捷键：空格翻转、←→切换、M 标记掌握
- 两种模式：study（逐卡）/ list（全部列表）
- 掌握进度条

## 已知问题

### ⚠️ CSS 冲突（高优先级）

`src/index.css` 第 480 行起追加了一套新设计系统（含暗色模式），与原有样式冲突：

- `:root` 中 `--text`、`--bg`、`--border`、`--shadow` 被重复定义，后值覆盖前值
- `#root` 设置了 `width: 1126px` + `text-align: center`，影响卡片布局
- 全局 `h1`(56px)、`h2`、`p` 样式覆盖组件内排版
- 暗色模式变量未与组件的 `--surface`、`--primary` 等变量统一

**建议方案**：将新设计系统的暗色模式能力融入原有变量体系，删除冲突的重复定义。

### 模板残留

`src/assets/` 下的 `hero.png`、`react.svg`、`vite.svg` 为 Vite 脚手架残留，未被引用，可安全删除。

## 待推进功能

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 🔴 高 | 整合暗色模式 | 解决 CSS 冲突，统一设计变量 |
| 🟡 中 | 数据持久化 | localStorage 保存卡片 + 掌握进度 |
| 🟡 中 | Shuffle 模式 | 随机打乱卡片顺序 |
| 🟢 低 | 卡片编辑 | 分割后手动修正正反面内容 |
| 🟢 低 | 导出功能 | 导出为 JSON / Anki (.apkg) 格式 |
| 🟢 低 | 清理残留资源 | 删除 assets/ 无用文件 |

## 设计意图

- 产品定位：轻量、零依赖、打开即用
- 交互理念：输入尽量自由（多格式兼容），输出尽量结构化（正反面卡片）
- 无后端、无数据库，纯前端运行
