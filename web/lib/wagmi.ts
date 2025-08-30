"use client";
import { http, createConfig } from "wagmi";
import { mainnet, hardhat, localhost } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [localhost, hardhat, mainnet],
  connectors: [injected()],
  ssr: true,
  transports: {
    [localhost.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
    [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
    [mainnet.id]: http(),
  },
});

