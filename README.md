# Web3大学 Monorepo

Packages:
- `web/` Next.js App Router frontend (wagmi + viem)
- `contracts/` Hardhat contracts (YDToken, Courses, MockSwap)
- `shared/` Shared types/utilities

Quick start:
1. Install deps: `pnpm i` from repo root.
2. Start local chain: `pnpm --filter @web3-university/contracts node`
3. In a second terminal, deploy + export ABIs: `pnpm --filter @web3-university/contracts deploy && pnpm --filter @web3-university/contracts export-abi`
4. Run web: `pnpm --filter web dev` and open http://localhost:3000

Notes:
- Swap is a mock with fixed 1 ETH = 4000 YD.
- Course metadata is stored in localStorage; chain stores purchases.
- Approve then Buy performs the two wallet interactions.

