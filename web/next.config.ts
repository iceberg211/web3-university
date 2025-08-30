import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { esmExternals: true },
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "31337",
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  },
};

export default nextConfig;
