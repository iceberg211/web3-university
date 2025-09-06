"use client";
import { useMemo } from "react";
import { parseEther } from "viem";
import { useTxStatus } from "./useTxStatus";
import { useSwapGasGuard, useRouterWethSync } from "./useStake";
import { UniswapV2RouterAbi } from "@/lib/defi";

export function useSwapOperations(
  address: `0x${string}` | undefined,
  router: string,
  weth: string,
  currentTokenAddress: string,
  ethAmount: string,
  ethBalance?: bigint,
  setWeth: (address: string) => void
) {
  // Parse ETH amount
  const parsedEth = useMemo(() => {
    try {
      return parseEther(ethAmount || "0");
    } catch {
      return undefined;
    }
  }, [ethAmount]);

  // Check if exceeds ETH balance
  const exceedsEth = useMemo(() => {
    if (!parsedEth || !ethBalance) return false;
    return parsedEth > ethBalance;
  }, [parsedEth, ethBalance]);

  // Transaction state
  const swapTx = useTxStatus(undefined);

  // Router WETH sync
  const { routerWeth, wethMismatch } = useRouterWethSync(router, weth, setWeth);

  // Gas estimation
  const {
    gasLimit: swapGasLimit,
    maxFeePerGas: swapMaxFeePerGas,
    estimatedCost: swapEstimatedCost,
    notEnoughForGas,
    message: gasCheckMsg,
  } = useSwapGasGuard({
    router,
    weth,
    usdt: currentTokenAddress,
    address,
    parsedEth,
    balance: ethBalance,
  });

  // Swap action
  const swapEthForToken = async () => {
    if (!parsedEth || parsedEth === 0n) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
    const amountOutMin = 0n;
    
    try {
      await swapTx.writeTx({
        address: router as `0x${string}`,
        abi: UniswapV2RouterAbi,
        functionName: "swapExactETHForTokens",
        args: [
          amountOutMin,
          [weth as `0x${string}`, currentTokenAddress as `0x${string}`],
          (address as `0x${string}`) || (weth as `0x${string}`),
          deadline,
        ],
        // @ts-expect-error: wagmi writeContract supports value on payable
        value: parsedEth,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Disable condition
  const disableSwap =
    !address ||
    swapTx.disableSubmit ||
    !parsedEth ||
    parsedEth === 0n ||
    exceedsEth ||
    notEnoughForGas ||
    wethMismatch;

  return {
    // States
    parsedEth,
    exceedsEth,
    routerWeth,
    wethMismatch,
    
    // Gas info
    swapGasLimit,
    swapMaxFeePerGas,
    swapEstimatedCost,
    notEnoughForGas,
    gasCheckMsg,
    
    // Transaction state
    swapTx,
    
    // Actions
    swapEthForToken,
    
    // Disable condition
    disableSwap,
  };
}