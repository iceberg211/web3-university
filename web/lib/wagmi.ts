"use client";
import { http } from "wagmi";
import { mainnet, hardhat, localhost, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "web3-university",
  projectId: process.env.VITE_RP_WC_PROJECT_ID || "web3-university",
  chains: [localhost, hardhat, mainnet, sepolia],
  // connectors: [injected()],
  ssr: true,
  transports: {
    [localhost.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
    ),
    [hardhat.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
    ),
    [sepolia.id]: http(process.env.VITE_RP_SEPOLIA_RPC_URL),
    [mainnet.id]: http(),
  },
});
