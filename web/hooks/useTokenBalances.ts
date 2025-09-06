"use client";
import { useBalance, useReadContract } from "wagmi";
import { isAddress } from "viem";
import { DEFAULTS, TOKENS } from "./useStake";
import { AaveV3ProtocolDataProviderAbi } from "@/lib/defi";

export function useTokenBalances(
  address: `0x${string}` | undefined,
  selectedToken: keyof typeof TOKENS,
  currentTokenAddress: string
) {
  const currentToken = TOKENS[selectedToken];

  // ETH balance
  const ethBalance = useBalance({
    address,
    query: { enabled: !!address },
  });

  // Current token balance
  const tokenBalance = useBalance({
    address,
    token: currentTokenAddress as `0x${string}`,
    query: {
      enabled: !!address && isAddress(currentTokenAddress as `0x${string}`),
    },
  });

  // Resolve aToken address via Protocol Data Provider when possible
  const reserveTokens = useReadContract({
    address: DEFAULTS.protocolDataProvider as `0x${string}`,
    abi: AaveV3ProtocolDataProviderAbi,
    functionName: "getReserveTokensAddresses",
    args: [currentTokenAddress as `0x${string}`],
    query: {
      enabled: isAddress(currentTokenAddress as `0x${string}`),
    },
  });
  const dynamicAToken = (reserveTokens.data?.[0] as `0x${string}` | undefined) ?? undefined;

  // aToken balance (staked amount) — prefer dynamic aToken, fallback to preset
  const aTokenToUse = (dynamicAToken || (currentToken.aTokenAddress as `0x${string}`)) as `0x${string}`;
  const aTokenBalance = useBalance({
    address,
    token: aTokenToUse,
    query: {
      enabled: !!address && isAddress(aTokenToUse as `0x${string}`),
    },
  });

  const refetchAll = () => {
    ethBalance.refetch?.();
    tokenBalance.refetch?.();
    aTokenBalance.refetch?.();
  };

  const refetchToken = () => {
    tokenBalance.refetch?.();
  };

  const refetchAToken = () => {
    aTokenBalance.refetch?.();
  };

  return {
    ethBalance,
    tokenBalance,
    aTokenBalance,
    refetchAll,
    refetchToken,
    refetchAToken,
  };
}
