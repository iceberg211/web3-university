"use client";
import { useReadContract } from "wagmi";
import { isAddress } from "viem";
import { AavePoolAbi } from "@/lib/defi";

export function useAaveReserve({
  pool,
  asset,
  enabled = true,
}: {
  pool: string;
  asset: string;
  enabled?: boolean;
}) {
  const reserveQuery = useReadContract({
    address: isAddress(pool as `0x${string}`) ? (pool as `0x${string}`) : undefined,
    abi: AavePoolAbi,
    functionName: "getReserveData",
    args: [isAddress(asset as `0x${string}`) ? (asset as `0x${string}`) : "0x0000000000000000000000000000000000000000"],
    query: { 
      enabled: enabled && isAddress(pool as `0x${string}`) && isAddress(asset as `0x${string}`)
    },
  });

  const reserveData = reserveQuery.data as any;
  
  // 解析配置位来检查储备是否被暂停
  const isReservePaused = reserveData ? 
    (BigInt(reserveData.configuration) & BigInt(1n << 60n)) !== 0n : false;
  
  const isReserveActive = reserveData ? 
    (BigInt(reserveData.configuration) & BigInt(1)) !== 0n : false;
  
  const isReserveFrozen = reserveData ? 
    (BigInt(reserveData.configuration) & BigInt(1n << 57n)) !== 0n : false;

  return {
    reserveQuery,
    reserveData,
    isReservePaused,
    isReserveActive, 
    isReserveFrozen,
    hasAToken: reserveData?.aTokenAddress && reserveData.aTokenAddress !== "0x0000000000000000000000000000000000000000",
    error: reserveQuery.error,
    isLoading: reserveQuery.isLoading,
  };
}
