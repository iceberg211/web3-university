"use client";
import { useMemo, useState } from "react";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

type Hex = `0x${string}`;

export type WriteArgs = Parameters<ReturnType<typeof useWriteContract>["writeContractAsync"]>[0];

export function useTxStatus(expectedChainId?: number) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, isPending: isWriting, error: writeError } = useWriteContract();
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);

  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId });

  const isNetworkMismatch = Boolean(
    expectedChainId && chainId && chainId !== expectedChainId
  );

  const writeTx = async (args: WriteArgs) => {
    setTxHash(undefined);
    const hash = await writeContractAsync(args);
    setTxHash(hash as Hex);
    return hash as Hex;
  };

  const explorerTxUrl = useMemo(() => {
    if (!txHash) return undefined as string | undefined;
    switch (chainId) {
      case 11155111:
        return `https://sepolia.etherscan.io/tx/${txHash}`;
      case 1:
        return `https://etherscan.io/tx/${txHash}`;
      default:
        return undefined;
    }
  }, [txHash, chainId]);

  const isConfirming = Boolean(txHash && !receipt.isSuccess && !receipt.isError);
  const disableSubmit = !isConnected || isWriting || receipt.isLoading || isNetworkMismatch;
  const combinedError = (writeError as Error | undefined) ?? (receipt.error as Error | undefined);

  return {
    // actions
    writeTx,
    // state
    txHash,
    chainId,
    isWriting,
    isConfirming,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError || Boolean(writeError),
    error: combinedError,
    receipt,
    explorerTxUrl,
    // ui helpers
    disableSubmit,
    isNetworkMismatch,
    expectedChainId,
  } as const;
}

