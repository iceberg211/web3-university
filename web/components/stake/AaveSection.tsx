"use client";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TxStatus from "@/components/tx-status";
import { TOKENS } from "@/hooks/useStake";

type TokenKey = keyof typeof TOKENS;

interface AaveSectionProps {
  selectedToken: TokenKey;
  tokenAmount: string;
  onTokenAmountChange: (amount: string) => void;
  tokenBalance: any;
  parsedToken?: bigint;
  exceedsToken: boolean;
  exceedsSupplyCap: boolean;
  supplyCapInfo?: {
    cap: string;
    used: string;
    available: string;
  };
  needsApproval: boolean;
  isApproved?: boolean;
  canCheck?: boolean;
  approveTx: any;
  supplyTx: any;
  onApprove: () => void;
  onSupply: () => void;
  disableApprove: boolean;
  disableSupply: boolean;
}

export default function AaveSection({
  selectedToken,
  tokenAmount,
  onTokenAmountChange,
  tokenBalance,
  parsedToken,
  exceedsToken,
  exceedsSupplyCap,
  supplyCapInfo,
  needsApproval,
  isApproved,
  canCheck,
  approveTx,
  supplyTx,
  onApprove,
  onSupply,
  disableApprove,
  disableSupply,
}: AaveSectionProps) {
  const currentToken = TOKENS[selectedToken];

  return (
    <div className="space-y-2">
      <Label>将 {currentToken.symbol} 存入 Aave（V3 Pool）</Label>

      {/* Supply cap info */}
      {supplyCapInfo && (
        <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded">
          供应上限：{supplyCapInfo.cap} {currentToken.symbol} | 已使用：
          {supplyCapInfo.used} {currentToken.symbol} | 可用：
          {supplyCapInfo.available} {currentToken.symbol}
        </div>
      )}

      {/* Input section */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-neutral-600">{currentToken.symbol}</div>
          <div className="text-xs text-neutral-500">
            余额：
            {tokenBalance.data
              ? Number(tokenBalance.data.formatted).toFixed(6)
              : "0"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={tokenAmount}
            onChange={(e) => onTokenAmountChange(e.target.value)}
            className="flex-1 text-lg"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (tokenBalance.data) {
                // 使用原始的 formatted 字符串，避免精度丢失
                // 只对超长的小数进行适当截断
                const formatted = tokenBalance.data.formatted;
                const truncated =
                  Number(formatted) > 0
                    ? Math.max(Number(formatted) - 0.000001, 0).toFixed(6)
                    : "0";
                onTokenAmountChange(truncated);
              } else {
                onTokenAmountChange("0");
              }
            }}
          >
            最大
          </Button>
        </div>

        {/* Validation messages */}
        {!parsedToken && (
          <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
        )}
        {exceedsSupplyCap && supplyCapInfo && (
          <div className="mt-1 text-xs text-red-600">
            超出 Aave 协议供应上限，当前可存入：{supplyCapInfo.available}{" "}
            {currentToken.symbol}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 items-center">
        <Button
          variant={
            !canCheck ? "secondary" : isApproved ? "outline" : "secondary"
          }
          onClick={onApprove}
          disabled={disableApprove || !canCheck || !!isApproved}
          className={
            isApproved ? "text-green-600 border-green-200 bg-green-50" : ""
          }
        >
          {!canCheck
            ? `授权 ${currentToken.symbol}`
            : isApproved
            ? `✓ 已授权 ${currentToken.symbol}`
            : `授权 ${currentToken.symbol}`}
        </Button>
        <Button onClick={onSupply}>
          存入 Aave
        </Button>
      </div>

      {/* Transaction status */}
      {approveTx.hash && <TxStatus {...approveTx} showNetworkWarning={false} />}
      {supplyTx.hash && <TxStatus {...supplyTx} showNetworkWarning={false} />}

      {/* Success message */}
      {supplyTx.isSuccess && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            🎉 <strong>质押成功！</strong>
          </div>
          <div className="text-xs text-green-600 mt-1">
            • 您已成功将 {currentToken.symbol} 存入 Aave 协议
            <br />• 您获得了对应的 a{currentToken.symbol} 代币作为存款凭证
            <br />• a{currentToken.symbol} 余额会随时间增长，反映您赚取的利息
            <br />• 您可以随时使用 a{currentToken.symbol} 赎回本金和利息
          </div>
        </div>
      )}
    </div>
  );
}
