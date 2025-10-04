# Repository Guidelines

## 项目结构与模块组织
- `web/`：Next.js App Router 前端（TypeScript、ESLint、Tailwind）。
- `contracts/`：Hardhat 合约（`YDToken`、`Courses`、`MockSwap`），ABI 导出至 `contracts/exports/`。
- `shared/`：可复用 TS 类型/工具，经 `tsup` 构建。
- 根为 `pnpm` workspace；忽略构建产物：`web/.next`、`contracts/artifacts`、`contracts/typechain-types`。

## 构建、测试与本地开发命令
- 安装依赖：`pnpm i` — 在仓库根执行。
- 前端开发：`pnpm --filter web dev` — 访问 http://localhost:3000。
- 本地区块链：`pnpm --filter @web3-university/contracts node` — 启动 Hardhat 节点。
- 部署合约：`pnpm --filter @web3-university/contracts deploy` 然后 `export-abi` — 同步 ABI。
- 构建全部：`pnpm -r build` — 构建 web、contracts、shared。
- Lint 全部：`pnpm -r lint` — web 使用 Next/ESLint 规则。

## 代码风格与命名规范
- TypeScript：2 空格缩进；导出处显式类型；变量/函数 `camelCase`，常量 `UPPER_SNAKE_CASE`。
- React：组件 `PascalCase` 放在 `web/components`；自定义 Hook 以 `useX` 命名。
- Solidity：SPDX 头；`^0.8.24`；函数 `camelCase`，合约 `PascalCase`。
- Lint：`web` 采用 `eslint` + `eslint-config-next`；提交前执行 `pnpm --filter web lint`。

## 测试指南
- 合约测试：置于 `contracts/test/`，运行 `pnpm --filter @web3-university/contracts hardhat test`。
- Web 测试（建议）：`web/__tests__/`，使用 Vitest/RTL，命名 `*.test.ts(x)`。
- 优先为 `shared/src` 的定价/工具等核心逻辑补单测。

## 提交与 Pull Request
- 提交信息遵循 Conventional Commits，例如：`feat: add course purchase flow`。
- PR 要求：简要标题、变更摘要、关联 issues、UI 截图（如适用），并注明合约/ABI 变更（记得运行 `export-abi`）与本地验证步骤。

## 安全与配置提示
- Web 环境变量：`web/.env.local`（参考 `.env.local.example`）；通过 `NEXT_PUBLIC_*` 注入，配置见 `web/next.config.ts`。
- RPC：默认本地 `http://127.0.0.1:8545`，chainId `31337`。不要提交 `.env.local`。
- 合约变更需重新部署并导出 ABI；前端依赖 `web/lib/contracts.ts` 与 `contracts/exports/`。

## Agent 说明
- 本文件对仓库根及子目录生效；子目录存在更具体的 AGENTS.md 时，其规则优先。
- 修改合约后务必执行 `deploy` 与 `export-abi`，避免 ABI 与前端不同步。
