# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Web3 DeFi education platform built as a monorepo with three main packages:

- `web/` - Next.js 15 frontend with App Router using wagmi + viem for Web3 interactions
- `contracts/` - Hardhat-based smart contracts (YDToken, Courses, MockSwap) 
- `shared/` - Shared types and utilities (currently minimal)

## Development Commands

### Initial Setup
```bash
# Install dependencies from repo root
pnpm i

# Start local blockchain (first terminal)
pnpm --filter @web3-university/contracts node

# Deploy contracts and export ABIs (second terminal)
pnpm --filter @web3-university/contracts deploy && pnpm --filter @web3-university/contracts export-abi

# Start frontend development server
pnpm --filter web dev
```

### Frontend (web/)
```bash
# Development with Turbopack
pnpm --filter web dev

# Build for production
pnpm --filter web build

# Lint code
pnpm --filter web lint
```

### Contracts (contracts/)
```bash
# Compile contracts
pnpm --filter @web3-university/contracts build

# Deploy to localhost
pnpm --filter @web3-university/contracts deploy

# Deploy to Sepolia testnet
pnpm --filter @web3-university/contracts deploy:sepolia

# Export contract ABIs for frontend
pnpm --filter @web3-university/contracts export-abi

# Sync contracts with web package
pnpm --filter @web3-university/contracts sync-web
```

## Architecture Overview

### Smart Contracts
- **YDToken.sol** - ERC20 token used for course purchases and staking
- **Courses.sol** - Manages course creation, enrollment, and payments
- **MockSwap.sol** - Fixed rate swap contract (1 ETH = 4000 YD tokens)

### Frontend Architecture
- **Next.js App Router** with TypeScript and Tailwind CSS
- **wagmi/viem** for Web3 interactions and wallet connections
- **RainbowKit** for wallet connection UI
- **Tanstack Query** for state management
- **Aave React SDK** for DeFi integrations

### Key Frontend Components
- `stake-form.tsx` - Main staking interface with token swapping and Aave integration
- `swap-form.tsx` - Token exchange functionality
- `stake/` directory - Modular staking components (AaveSection, SwapSection, etc.)
- `buy-button.tsx` - Course purchase workflow

### Configuration
- **Chain Support**: Localhost (31337), Hardhat, Sepolia testnet, Mainnet
- **RPC Endpoints**: Configurable via environment variables
- **Default Local**: http://127.0.0.1:8545

## Development Notes

- Course metadata stored in localStorage, purchases recorded on-chain
- "Approve then Buy" pattern requires two wallet transactions
- Mock swap uses fixed exchange rate for educational purposes
- Hardhat config includes educational mnemonic (not for production use)

## Environment Setup

Key environment variables:
- `NEXT_PUBLIC_CHAIN_ID` - Chain ID (default: 11155111 for Sepolia)
- `NEXT_PUBLIC_RPC_URL` - RPC endpoint (default: http://127.0.0.1:8545)
- `VITE_RP_WC_PROJECT_ID` - WalletConnect project ID