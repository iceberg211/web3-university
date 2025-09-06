"use client";
import { useState, useMemo } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, parseUnits } from "viem";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TxStatus from "@/components/tx-status";
import { TOKENS } from "@/hooks/useStake";
import { ERC20Abi, AaveV3PoolAbi } from "@/lib/defi";

type TokenKey = keyof typeof TOKENS;

interface AaveSectionProps {
  selectedToken: TokenKey;
  tokenAmount: string;
  onTokenAmountChange: (amount: string) => void;
  tokenBalance: any;
  currentTokenAddress: string;
  pool: string;
}

export default function AaveSection({
  selectedToken,
  tokenAmount,
  onTokenAmountChange,
  tokenBalance,
  currentTokenAddress,
  pool,
}: AaveSectionProps) {
  const { address, isConnected } = useAccount();
  const currentToken = TOKENS[selectedToken];
  
  // Transaction states
  const { writeContractAsync: approveAsync, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: supplyAsync, isPending: isSupplying } = useWriteContract();
  const [approveHash, setApproveHash] = useState<string>();
  const [supplyHash, setSupplyHash] = useState<string>();
  
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash as `0x${string}` });
  const supplyReceipt = useWaitForTransactionReceipt({ hash: supplyHash as `0x${string}` });

  // Parse token amount
  const parsedToken = useMemo(() => {
    try {
      if (!tokenAmount || tokenAmount === "0") return 0n;
      return parseUnits(tokenAmount, currentToken.decimals);
    } catch {
      return 0n;
    }
  }, [tokenAmount, currentToken.decimals]);

  // Check allowance
  const { data: allowance } = useReadContract({
    address: currentTokenAddress as `0x${string}`,
    abi: ERC20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, pool as `0x${string}`],
    query: {
      enabled: !!(address && isAddress(currentTokenAddress as `0x${string}`) && isAddress(pool as `0x${string}`)),
    },
  });

  // Simple approval check
  const needsApproval = parsedToken > 0n && allowance !== undefined && parsedToken > allowance;
  const isApproved = approveReceipt.isSuccess || (parsedToken > 0n && allowance !== undefined && parsedToken <= allowance);

  // Approve token
  const handleApprove = async () => {
    if (!parsedToken || !address) return;
    try {
      const hash = await approveAsync({
        address: currentTokenAddress as `0x${string}`,
        abi: ERC20Abi,
        functionName: "approve",
        args: [pool as `0x${string}`, parsedToken],
      });
      setApproveHash(hash);
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  // Supply to Aave
  const handleSupply = async () => {
    if (!parsedToken || !address) return;
    
    // Debug: Log balance info
    console.log("Supply Debug Info:");
    console.log("- tokenAmount:", tokenAmount);
    console.log("- parsedToken:", parsedToken.toString());
    console.log("- tokenBalance raw:", tokenBalance?.data?.value?.toString());
    console.log("- tokenBalance formatted:", tokenBalance?.data?.formatted);
    console.log("- exceedsBalance:", exceedsBalance);
    
    try {
      const hash = await supplyAsync({
        address: pool as `0x${string}`,
        abi: AaveV3PoolAbi,
        functionName: "deposit",
        args: [
          currentTokenAddress as `0x${string}`,
          parsedToken,
          address as `0x${string}`,
          0,
        ],
      });
      setSupplyHash(hash);
    } catch (error) {
      console.error("Supply failed:", error);
    }
  };

  // Check if amount exceeds balance
  const exceedsBalance = parsedToken > 0n && 
    tokenBalance?.data?.value !== undefined && 
    parsedToken > tokenBalance.data.value;

  const canApprove = isConnected && parsedToken > 0n && needsApproval && !isApproving && !exceedsBalance;
  const canSupply = isConnected && parsedToken > 0n && !needsApproval && !isSupplying && !exceedsBalance;

  return (
    <div className="space-y-4">
      <Label>将 {currentToken.symbol} 存入 Aave（V3 Pool）</Label>

      {/* Input section */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-neutral-600">{currentToken.symbol}</div>
          <div className="text-xs text-neutral-500">
            余额：
            {tokenBalance?.data
              ? Number(tokenBalance.data.formatted).toFixed(6)
              : "0"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={tokenAmount}
            onChange={(e) => onTokenAmountChange(e.target.value)}
            placeholder="0.0"
            className="flex-1 text-lg"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (tokenBalance?.data?.formatted) {
                // 使用原始的 formatted 字符串，稍微减少一点点避免精度问题
                const balance = tokenBalance.data.formatted;
                const balanceNum = Number(balance);
                
                // 对于小数位很多的情况，保留最多6位小数并稍微减少
                let maxAmount: string;
                if (balanceNum > 0.000001) {
                  // 减少最后一位来避免精度问题
                  maxAmount = (balanceNum * 0.999999).toFixed(6);
                } else if (balanceNum > 0) {
                  // 对于非常小的余额，使用99%
                  maxAmount = (balanceNum * 0.99).toFixed(8);
                } else {
                  maxAmount = "0";
                }
                
                onTokenAmountChange(maxAmount);
              }
            }}
          >
            最大
          </Button>
        </div>

        {/* Validation */}
        {parsedToken === 0n && tokenAmount && (
          <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
        )}
        {exceedsBalance && (
          <div className="mt-1 text-xs text-red-600">
            金额超出余额，当前余额：
            {tokenBalance?.data?.formatted ? Number(tokenBalance.data.formatted).toFixed(6) : "0"} {currentToken.symbol}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 items-center">
        <Button
          onClick={handleApprove}
          disabled={!canApprove}
          variant={isApproved ? "outline" : "secondary"}
          className={isApproved ? "text-green-600 border-green-200 bg-green-50" : ""}
        >
          {isApproving ? "授权中..." : 
           isApproved ? `✓ 已授权 ${currentToken.symbol}` : 
           `授权 ${currentToken.symbol}`}
        </Button>
        
        <Button
          onClick={handleSupply}
          disabled={!canSupply}
        >
          {isSupplying ? "存入中..." : "存入 Aave"}
        </Button>
      </div>

      {/* Status info */}
      {needsApproval && (
        <div className="text-sm text-amber-600">
          需要先授权 {currentToken.symbol} 给 Aave 协议
        </div>
      )}

      {/* Transaction status */}
      {approveHash && (
        <TxStatus 
          hash={approveHash} 
          isSuccess={approveReceipt.isSuccess}
          isError={approveReceipt.isError}
          showNetworkWarning={false} 
        />
      )}
      
      {supplyHash && (
        <TxStatus 
          hash={supplyHash} 
          isSuccess={supplyReceipt.isSuccess}
          isError={supplyReceipt.isError}
          showNetworkWarning={false} 
        />
      )}

      {/* Success message */}
      {supplyReceipt.isSuccess && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            🎉 <strong>存入成功！</strong>
          </div>
          <div className="text-xs text-green-600 mt-1">
            您已成功将 {tokenAmount} {currentToken.symbol} 存入 Aave 协议
          </div>
        </div>
      )}
    </div>
  );
}