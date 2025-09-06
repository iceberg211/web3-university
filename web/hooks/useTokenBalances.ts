"use client";
import { useBalance } from "wagmi";
import { isAddress } from "viem";
import { TOKENS } from "./useStake";

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

  // aToken balance (staked amount)
  const aTokenBalance = useBalance({
    address,
    token: currentToken.aTokenAddress as `0x${string}`,
    query: {
      enabled: !!address && isAddress(currentToken.aTokenAddress as `0x${string}`),
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