# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目结构

这是一个 Web3 DeFi 教育平台，采用 monorepo 架构，包含三个主要包：

- `web/` - Next.js 15 前端，使用 App Router，通过 wagmi + viem 进行 Web3 交互
- `contracts/` - 基于 Hardhat 的智能合约（YDToken、Courses、MockSwap）
- `shared/` - 共享类型和工具（目前较少）

## 开发命令

### 初始设置
```bash
# 从仓库根目录安装依赖
pnpm i

# 启动本地区块链（第一个终端）
pnpm --filter @web3-university/contracts node

# 部署合约并导出 ABI（第二个终端）
pnpm --filter @web3-university/contracts deploy && pnpm --filter @web3-university/contracts export-abi

# 启动前端开发服务器
pnpm --filter web dev
```

### 前端 (web/)
```bash
# 使用 Turbopack 开发
pnpm --filter web dev

# 生产环境构建
pnpm --filter web build

# 代码检查
pnpm --filter web lint
```

### 合约 (contracts/)
```bash
# 编译合约
pnpm --filter @web3-university/contracts build

# 部署到 localhost
pnpm --filter @web3-university/contracts deploy

# 部署到 Sepolia 测试网
pnpm --filter @web3-university/contracts deploy:sepolia

# 导出合约 ABI 供前端使用
pnpm --filter @web3-university/contracts export-abi

# 同步合约到 web 包
pnpm --filter @web3-university/contracts sync-web
```

## 架构概览

### 智能合约
- **YDToken.sol** - ERC20 代币，用于课程购买和质押
- **Courses.sol** - 管理课程创建、注册和支付
- **MockSwap.sol** - 固定汇率兑换合约（1 ETH = 4000 YD 代币）

### 前端架构
- **Next.js App Router** 使用 TypeScript 和 Tailwind CSS
- **wagmi/viem** 用于 Web3 交互和钱包连接
- **RainbowKit** 提供钱包连接 UI
- **Tanstack Query** 用于状态管理
- **Aave React SDK** 用于 DeFi 集成

### 核心前端组件
- `stake-form.tsx` - 主质押界面，集成代币兑换和 Aave
- `swap-form.tsx` - 代币兑换功能
- `stake/` 目录 - 模块化质押组件（AaveSection、SwapSection 等）
- `buy-button.tsx` - 课程购买流程

### 配置
- **链支持**: Localhost (31337)、Hardhat、Sepolia 测试网、主网
- **RPC 端点**: 通过环境变量配置
- **默认本地**: http://127.0.0.1:8545

## 开发注意事项

- 课程元数据存储在 localStorage，购买记录在链上
- "授权后购买"模式需要两次钱包交易
- Mock swap 使用固定汇率，仅用于教学目的
- Hardhat 配置包含教学用助记词（请勿用于生产环境）

## 环境配置

关键环境变量：
- `NEXT_PUBLIC_CHAIN_ID` - 链 ID（默认: 11155111 Sepolia）
- `NEXT_PUBLIC_RPC_URL` - RPC 端点（默认: http://127.0.0.1:8545）
- `VITE_RP_WC_PROJECT_ID` - WalletConnect 项目 ID