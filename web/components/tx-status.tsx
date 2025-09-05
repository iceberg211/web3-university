"use client";
import { useTxStatus } from "@/hooks/useTxStatus";

export default function TxStatus(
  props: ReturnType<typeof useTxStatus> & { showNetworkWarning?: boolean }
) {
  const {
    isNetworkMismatch,
    chainId,
    expectedChainId,
    isWriting,
    txHash,
    isConfirming,
    isSuccess,
    error,
    receipt,
    explorerTxUrl,
    showNetworkWarning = true,
  } = props as any;

  return (
    <div className="text-sm">
      {showNetworkWarning && isNetworkMismatch && (
        <div className="text-orange-600">
          当前网络 {chainId} 与期望网络 {expectedChainId} 不一致，请切换网络
        </div>
      )}
      {isWriting && <span className="muted">等待钱包签名...</span>}
      {txHash && !isSuccess && (
        <span className="muted">
          交易已提交：{(txHash as string).slice(0, 10)}... 等待确认...
          {explorerTxUrl && (
            <a href={explorerTxUrl} target="_blank" rel="noreferrer" className="underline ml-2">
              在 Etherscan 查看
            </a>
          )}
        </span>
      )}
      {isConfirming && <span className="muted">等待区块确认...</span>}
      {isSuccess && (
        <span>成功！区块 #{(receipt as any).data?.blockNumber?.toString?.()}</span>
      )}
      {(props as any).isError && (
        <span className="text-red-600">{String((error as any)?.message || (receipt as any).error?.message || "未知错误")}</span>
      )}
    </div>
  );
}

