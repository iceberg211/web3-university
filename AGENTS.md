# Repository Guidelines

## Project Structure & Module Organization
- `web/`: Next.js App Router frontend (TypeScript, ESLint, Tailwind).
- `contracts/`: Hardhat Solidity contracts (`YDToken`, `Courses`, `MockSwap`) with TypeChain outputs and ABI exports under `exports/`.
- `shared/`: Reusable TS types/utilities built with `tsup`.
- Root is a `pnpm` workspace; avoid committing build artifacts: `web/.next`, `contracts/artifacts`, `contracts/typechain-types`.

## Build, Test, and Development Commands
- Install: `pnpm i` (run at repo root).
- Dev (web): `pnpm --filter web dev` (http://localhost:3000).
- Local chain: `pnpm --filter @web3-university/contracts node`.
- Deploy contracts: `pnpm --filter @web3-university/contracts deploy` then `export-abi`.
- Build all: `pnpm -r build` (web, contracts, shared).
- Lint all: `pnpm -r lint` (uses Next/ESLint in `web`).

## Coding Style & Naming Conventions
- TypeScript: 2-space indent, no semver-breaking TS features; prefer explicit types at exports.
- React: Components `PascalCase` in `web/components`, hooks `useX`.
- Variables/functions: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- Solidity: SPDX header, ^0.8.24, functions `camelCase`, contracts `PascalCase`.
- Linting: `web` uses `eslint` with `eslint-config-next`. Run `pnpm --filter web lint` before PRs.

## Testing Guidelines
- No tests included yet.
- Contracts: add tests under `contracts/test/` and run `pnpm --filter @web3-university/contracts hardhat test`.
- Web: recommended to add Vitest/RTL under `web/__tests__/` with `*.test.ts(x)`.
- Aim for meaningful unit tests on pricing/utils (`shared/src`) and core contract flows.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat:`, `fix:`, `chore:`). Example: `feat: add course purchase flow`.
- PRs: concise title, summary of changes, linked issues, screenshots for UI, and note any contract/ABI changes (run `export-abi`).
- Keep PRs focused and small; include steps to verify locally.

## Security & Configuration Tips
- Web env: set `web/.env.local` (see `.env.local.example`). Keys consumed via `NEXT_PUBLIC_*` in `web/next.config.ts`.
- RPC: defaults to `31337` at `http://127.0.0.1:8545` for local.
- Do not commit secrets or `.env.local`.
- When contracts change, redeploy and re-export ABIs to `contracts/exports/` used by `web/lib/contracts.ts`.

