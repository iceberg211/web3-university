"use client";
import BalanceCard from "@/components/ui/balance-card";
import { TOKENS } from "@/hooks/useStake";

type TokenKey = keyof typeof TOKENS;

interface BalanceSectionProps {
  selectedToken: TokenKey;
  ethBalance: any;
  tokenBalance: any;
  aTokenBalance: any;
  isValidTokenAddress: boolean;
}

export default function BalanceSection({
  selectedToken,
  ethBalance,
  tokenBalance,
  aTokenBalance,
  isValidTokenAddress,
}: BalanceSectionProps) {
  const currentToken = TOKENS[selectedToken];

  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <BalanceCard
        label="ETH 余额"
        value={
          ethBalance.data
            ? `${Number(ethBalance.data.formatted).toFixed(4)} ${
                ethBalance.data.symbol
              }`
            : "加载中..."
        }
      />
      <BalanceCard
        label={`${currentToken.symbol} 余额`}
        value={
          !isValidTokenAddress
            ? "地址无效"
            : tokenBalance.isError
            ? "读取失败"
            : tokenBalance.data
            ? `${Number(tokenBalance.data.formatted).toFixed(4)} ${currentToken.symbol}`
            : "加载中..."
        }
      />
      <BalanceCard
        label={`a${currentToken.symbol} 质押`}
        value={
          aTokenBalance.isError
            ? "读取失败"
            : aTokenBalance.data
            ? `${Number(aTokenBalance.data.formatted).toFixed(4)} a${currentToken.symbol}`
            : "0.0000"
        }
        className={
          Number(aTokenBalance.data?.formatted || 0) > 0
            ? "border-green-200 bg-green-50"
            : ""
        }
      />
    </div>
  );
}