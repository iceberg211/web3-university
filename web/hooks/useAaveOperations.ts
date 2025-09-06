"use client";
import { useEffect, useMemo } from "react";
import { isAddress, parseUnits, formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { useTxStatus } from "./useTxStatus";
import { useAllowance } from "./useAllowance";
import { useCodePresent } from "./useStake";
import { 
  AaveV3PoolAbi, 
  AaveV3ProtocolDataProviderAbi, 
  Erc20Abi 
} from "@/lib/defi";
import { DEFAULTS } from "./useStake";
import { TOKENS } from "./useStake";

export function useAaveOperations(
  address: `0x${string}` | undefined,
  selectedToken: keyof typeof TOKENS,
  currentTokenAddress: string,
  tokenAmount: string,
  pool: string
) {
  const currentToken = TOKENS[selectedToken];
  
  // Parse token amount
  const parsedToken = useMemo(() => {
    try {
      return parseUnits(tokenAmount || "0", currentToken.decimals);
    } catch {
      return undefined;
    }
  }, [tokenAmount, currentToken.decimals]);

  // Transaction states
  const approveTx = useTxStatus(undefined);
  const supplyTx = useTxStatus(undefined);

  // Code presence checks
  const { hasCode: poolHasCode } = useCodePresent(
    isAddress(pool as `0x${string}`) ? (pool as `0x${string}`) : undefined
  );
  const { hasCode: tokenHasCode } = useCodePresent(
    isAddress(currentTokenAddress as `0x${string}`) 
      ? (currentTokenAddress as `0x${string}`) 
      : undefined
  );

  // Allowance check
  const { needsApproval, isApproved, canCheck, allowanceQuery } = useAllowance({
    token: isAddress(currentTokenAddress as `0x${string}`)
      ? (currentTokenAddress as `0x${string}`)
      : undefined,
    spender: isAddress(pool as `0x${string}`)
      ? (pool as `0x${string}`)
      : undefined,
    amount: parsedToken,
    enabled:
      !!address &&
      isAddress(currentTokenAddress as `0x${string}`) &&
      isAddress(pool as `0x${string}`) &&
      !!parsedToken,
  });

  // Supply caps and current supply data
  const reserveCapsQuery = useReadContract({
    address: DEFAULTS.protocolDataProvider as `0x${string}`,
    abi: AaveV3ProtocolDataProviderAbi,
    functionName: "getReserveCaps",
    args: [currentTokenAddress as `0x${string}`],
    query: {
      enabled: isAddress(currentTokenAddress as `0x${string}`),
    },
  });

  const reserveDataQuery = useReadContract({
    address: DEFAULTS.protocolDataProvider as `0x${string}`,
    abi: AaveV3ProtocolDataProviderAbi,
    functionName: "getReserveData",
    args: [currentTokenAddress as `0x${string}`],
    query: {
      enabled: isAddress(currentTokenAddress as `0x${string}`),
    },
  });

  const supplyCap = reserveCapsQuery.data?.[1];
  const totalAToken = reserveDataQuery.data?.[2];
  
  const exceedsSupplyCap = useMemo(() => {
    if (!parsedToken || !supplyCap || !totalAToken) return false;
    if (supplyCap === 0n) return false;
    const availableSupply = supplyCap - totalAToken;
    return parsedToken > availableSupply;
  }, [parsedToken, supplyCap, totalAToken]);

  // Actions
  const approveToken = async () => {
    if (!parsedToken || parsedToken === 0n) return;
    try {
      await approveTx.writeTx({
        address: currentTokenAddress as `0x${string}`,
        abi: Erc20Abi,
        functionName: "approve",
        args: [pool as `0x${string}`, parsedToken],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const supplyToken = async () => {
    if (!parsedToken || parsedToken === 0n) return;
    try {
      await supplyTx.writeTx({
        address: pool as `0x${string}`,
        abi: AaveV3PoolAbi,
        functionName: "deposit",
        args: [
          currentTokenAddress as `0x${string}`,
          parsedToken,
          (address as `0x${string}`) || (currentTokenAddress as `0x${string}`),
          0,
        ],
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Disable conditions
  const poolValid = isAddress(pool as `0x${string}`);
  
  const disableApprove =
    !address ||
    approveTx.disableSubmit ||
    !parsedToken ||
    parsedToken === 0n ||
    exceedsSupplyCap ||
    !isAddress(currentTokenAddress as `0x${string}`) ||
    !poolValid ||
    tokenHasCode === false;

  const disableSupply =
    !address ||
    supplyTx.disableSubmit ||
    !parsedToken ||
    parsedToken === 0n ||
    exceedsSupplyCap ||
    needsApproval ||
    !isAddress(currentTokenAddress as `0x${string}`) ||
    !poolValid ||
    poolHasCode === false ||
    tokenHasCode === false;

  return {
    // States
    parsedToken,
    needsApproval,
    isApproved,
    canCheck,
    exceedsSupplyCap,
    supplyCap,
    totalAToken,
    
    // Transaction states
    approveTx,
    supplyTx,
    
    // Actions
    approveToken,
    supplyToken,
    
    // Disable conditions
    disableApprove,
    disableSupply,
    
    // Queries for refetch
    allowanceQuery,
    
    // Computed values
    availableSupply: supplyCap && totalAToken ? supplyCap - totalAToken : undefined,
    supplyCapInfo: supplyCap && totalAToken ? {
      cap: Number(formatUnits(supplyCap, currentToken.decimals)).toFixed(0),
      used: Number(formatUnits(totalAToken, currentToken.decimals)).toFixed(2),
      available: Number(formatUnits(supplyCap - totalAToken, currentToken.decimals)).toFixed(2),
    } : undefined,
  };
}
