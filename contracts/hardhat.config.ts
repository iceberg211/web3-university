import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/a87057817bf74015ad1c2b1e20c3d2a8",
      accounts: {
        // 学习环境示例：直接使用助记词。请勿在生产中硬编码私钥/助记词。
        mnemonic:
          "priority twist wheel flee purity answer cage trim front timber acquire draw",
      },
    },
  },
  etherscan: {
    apiKey: "NI1PYSUWC2DPE5F3YUSEZ6MJP3X51RCJTF",
  },
};

export default config;
