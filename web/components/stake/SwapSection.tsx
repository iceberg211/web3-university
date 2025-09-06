"use client";
import { formatEther } from "viem";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TxStatus from "@/components/tx-status";
import { TOKENS } from "@/hooks/useStake";

type TokenKey = keyof typeof TOKENS;

interface SwapSectionProps {
  selectedToken: TokenKey;
  ethAmount: string;
  onEthAmountChange: (amount: string) => void;
  ethBalance: any;
  parsedEth?: bigint;
  exceedsEth: boolean;
  notEnoughForGas: boolean;
  gasCheckMsg?: string | null;
  swapGasLimit?: bigint | null;
  swapMaxFeePerGas?: bigint | null;
  swapTx: any;
  onSwap: () => void;
  disableSwap: boolean;
}

export default function SwapSection({
  selectedToken,
  ethAmount,
  onEthAmountChange,
  ethBalance,
  parsedEth,
  exceedsEth,
  notEnoughForGas,
  gasCheckMsg,
  swapGasLimit,
  swapMaxFeePerGas,
  swapTx,
  onSwap,
  disableSwap,
}: SwapSectionProps) {
  const currentToken = TOKENS[selectedToken];

  return (
    <div className="space-y-2">
      <Label>用 ETH 兑换 {currentToken.symbol}（Uniswap V2）</Label>
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-neutral-600">ETH</div>
          <div className="text-xs text-neutral-500">
            余额：
            {ethBalance.data ? Number(ethBalance.data.formatted).toFixed(6) : "0"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={ethAmount}
            onChange={(e) => onEthAmountChange(e.target.value)}
            className="flex-1 text-lg"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onEthAmountChange(
                ethBalance.data
                  ? Math.max(
                      Number(ethBalance.data.formatted) - 0.005,
                      0
                    ).toFixed(6)
                  : "0"
              )
            }
          >
            最大
          </Button>
        </div>
        {!parsedEth && (
          <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
        )}
        {exceedsEth && (
          <div className="mt-1 text-xs text-red-600">余额不足</div>
        )}
        {notEnoughForGas && (
          <div className="mt-1 text-xs text-red-600">
            {gasCheckMsg || "兑换金额 + 预估 gas 超出余额"}
          </div>
        )}
        {swapGasLimit && swapMaxFeePerGas && (
          <div className="mt-1 text-xs text-neutral-500">
            预估手续费：
            {Number(formatEther(swapGasLimit * swapMaxFeePerGas)).toFixed(6)} ETH
          </div>
        )}
      </div>
      <div className="text-xs text-neutral-500">
        提示：演示默认 amountOutMin=0，生产环境请加入预估与滑点保护。测试网请确保
        Router/WETH/{currentToken.symbol} 存在并有流动性。
      </div>
      <Button onClick={onSwap} disabled={disableSwap}>
        用 Uniswap 兑换
      </Button>
      <TxStatus {...swapTx} showNetworkWarning={false} />
    </div>
  );
}