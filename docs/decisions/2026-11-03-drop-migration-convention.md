# 决策：删除 MIGRATION_CONVENTION.md 与 tools/check-migrations.sh

- 日期：2026-11-03
- 状态：已采纳
- 相关提交：`d7a3316`（docs: drop the unused migration convention）
- 相关评审：`docs/reviews/2026-11-02-code-review.md` P2-4

## 背景

仓库此前带有 `MIGRATION_CONVENTION.md` 与 `tools/check-migrations.sh`，但仓库既没有迁移目录，也没有任何数据库依赖。评审 P2-4 将这套约定判定为「空转的误导性死文档」。

## 决策

删除这两个文件，不把检查脚本接入 `package.json` 或 CI。等仓库真正需要持久化 schema 时再重建。

## 理由（均已在当前代码上复核）

1. **全仓没有迁移目录。** 仓库根目录不存在 `supabase/`、`db/` 或 `migrations/`；`find` 唯一命中的 `./.git/objects/db` 是 Git 内部对象目录，不是业务目录。
2. **没有数据库依赖。** `package.json` 的运行依赖只有 `react` 与 `react-dom`，全仓 `src/` 无 `supabase`、`postgres`、`prisma`、`sqlite` 引用。
3. **卡片数据只存在于内存。** `src/App.tsx:11` 用 `useState<FlashCard[]>` 持有卡片，`src/App.tsx:26` 直接作为 prop 传给 `CardView`；`src/` 中没有 `localStorage`、`indexedDB`、`sessionStorage` 或 `fetch` 持久化。
4. **检查脚本没有目录可查，只能恒退 1。** 被删除的脚本在找不到迁移目录时以退出码 1 结束（评审记录 `tools/check-migrations.sh:38-39`），且从未接入任何 npm script 或 CI；`package.json` 的 scripts 只有 `dev`、`build`、`lint`、`test`、`preview`。

## 影响

- 贡献者不会再看到一套与本仓库实际无关的数据库迁移约定。
- 仓库暂时失去迁移文件命名与检查的执行约束，这是有意接受的：当前没有 schema，约束无从落地。
- `docs/reviews/2026-11-02-code-review.md` 仍会引用这两个已删除的文件；评审文档是历史记录，不随决策回改。

## 重建条件

当本仓库首次引入持久化 schema（Supabase Postgres、自托管 Postgres、SQLite 等）时，必须同时完成：

1. 建立对应的迁移目录（例如 `supabase/migrations/` 或 `db/migrations/`）；
2. 重建迁移检查脚本，并接入 npm script 或 CI，使其在真实目录上可执行、可通过；
3. 在本目录追加一条新决策，写明目录选择、文件命名与检查方式。

只恢复文档而不接入检查，等于重新制造这次被删除的空转约定，不要这样做。
