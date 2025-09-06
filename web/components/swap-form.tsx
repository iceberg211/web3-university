"use client";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { abis, addresses } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";
import { useTxStatus } from "@/hooks/useTxStatus";
import TxStatus from "@/components/tx-status";
import BalanceCard from "@/components/ui/balance-card";
import { useAllowance } from "@/hooks/useAllowance";

type Direction = "ETH_TO_YD" | "YD_TO_ETH";

const SLIPPAGE_BPS = 50; // 0.5% 仅用于展示的最小可得估算
const GAS_BUFFER_WEI = parseEther("0.001"); // 预留 0.001 ETH 作为gas，Max按钮用

export default function SwapForm() {
  const { address, isConnected } = useAccount();
  const ethBal = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
  });
  const ydBal = useBalance({
    address,
    token: addresses.YDToken as `0x${string}`,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
  });
  const [direction, setDirection] = useState<Direction>("ETH_TO_YD");
  const [payAmount, setPayAmount] = useState("0.01");
  const [isDirectionChanging, setIsDirectionChanging] = useState(false);
  const EXPECTED_CHAIN_ID = Number(
    process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"
  );
  const {
    writeTx,
    txHash,
    chainId,
    isWriting,
    isConfirming,
    isSuccess,
    isError,
    error,
    receipt,
    explorerTxUrl,
    disableSubmit,
    isNetworkMismatch,
  } = useTxStatus(EXPECTED_CHAIN_ID);

  // 读取汇率（合约常量）——缓存为常量，切换时不重新读取
  const rateQuery = useReadContract({
    address: addresses.MockSwap as `0x${string}`,
    abi: abis.MockSwap,
    functionName: "RATE",
    query: { staleTime: Infinity, gcTime: Infinity },
  });
  const rate = (rateQuery.data as bigint | undefined) ?? 4000n; // 兜底

  // 解析输入与余额校验（增加方向切换时的保护）
  const parsedPay = useMemo(() => {
    // 在方向切换过程中，不解析金额，避免错误状态
    if (isDirectionChanging || !payAmount || payAmount === "") {
      return undefined;
    }
    
    try {
      if (direction === "ETH_TO_YD") {
        return parseEther(payAmount);
      }
      return parseUnits(payAmount, 18);
    } catch {
      return undefined;
    }
  }, [payAmount, direction, isDirectionChanging]);

  // 读取 YD allowance（当 YD -> ETH 时需要授权）
  const { allowanceQuery, allowance, needsApproval } = useAllowance({
    token: addresses.YDToken as `0x${string}`,
    spender: addresses.MockSwap as `0x${string}`,
    amount: direction === "YD_TO_ETH" ? parsedPay : undefined,
    enabled: direction === "YD_TO_ETH" && !!address && parsedPay !== undefined,
  });

  // 计算是否有足够的授权
  const hasAllowance = useMemo(() => {
    if (direction === "ETH_TO_YD") return true; // ETH 转 YD 不需要授权
    if (allowance === undefined || !parsedPay) return false;
    return allowance >= parsedPay;
  }, [direction, allowance, parsedPay]);

  const payBalance =
    direction === "ETH_TO_YD" ? ethBal.data?.value : ydBal.data?.value;
  const exceedsBalance = useMemo(() => {
    if (!parsedPay || !payBalance) return false;
    return parsedPay > payBalance;
  }, [parsedPay, payBalance]);

  const estimatedReceive = useMemo(() => {
    if (!parsedPay) return 0n;
    if (direction === "ETH_TO_YD") {
      // YD = ETH * RATE
      return parsedPay * rate;
    }
    // ETH = YD / RATE
    return parsedPay / rate;
  }, [parsedPay, direction, rate]);

  const minReceive = useMemo(
    () => (estimatedReceive * BigInt(10000 - SLIPPAGE_BPS)) / 10000n,
    [estimatedReceive]
  );

  // Max 按钮：为 ETH 预留gas，增加更安全的处理
  const onMax = () => {
    if (isDirectionChanging || !payBalance) return;
    
    const bal = payBalance;
    let max = bal;
    
    if (direction === "ETH_TO_YD") {
      // 为 ETH 交易预留 gas 费用
      max = bal > GAS_BUFFER_WEI ? bal - GAS_BUFFER_WEI : 0n;
      const formatted = formatEther(max);
      // 限制小数位数，避免精度问题
      setPayAmount(Number(formatted).toFixed(6));
    } else {
      const formatted = formatUnits(max, 18);
      setPayAmount(Number(formatted).toFixed(6));
    }
  };

  const doSwap = async () => {
    if (!parsedPay || parsedPay === 0n) return;
    try {
      if (direction === "ETH_TO_YD") {
        await writeTx({
          address: addresses.MockSwap as `0x${string}`,
          abi: abis.MockSwap,
          functionName: "ethToYD",
          args: [],
          // @ts-expect-error wagmi may not infer payable
          value: parsedPay,
        });
      } else {
        await writeTx({
          address: addresses.MockSwap as `0x${string}`,
          abi: abis.MockSwap,
          functionName: "ydToEth",
          args: [parsedPay],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const approveIfNeeded = async () => {
    if (direction !== "YD_TO_ETH" || !parsedPay) return;
    try {
      await writeTx({
        address: addresses.YDToken as `0x${string}`,
        abi: abis.YDToken,
        functionName: "approve",
        args: [addresses.MockSwap as `0x${string}`, parsedPay],
      });
    } catch (e) {
      console.error(e);
    }
  };

  // needsApproval 已通过 useAllowance 提供

  // 当切换方向时的处理
  useEffect(() => {
    if (isDirectionChanging) {
      // 重置为合理的默认值
      setPayAmount("0.01");
      setIsDirectionChanging(false);
    }
  }, [isDirectionChanging]);

  // 监听交易成功，刷新余额和授权状态
  useEffect(() => {
    if (isSuccess && txHash) {
      
      // 延迟刷新，确保链上状态已更新
      setTimeout(() => {
        ethBal.refetch?.();
        ydBal.refetch?.();
        if (direction === "YD_TO_ETH") {
          allowanceQuery.refetch?.();
        }
      }, 1000);
    }
  }, [isSuccess, txHash, ethBal, ydBal, direction, allowanceQuery]);

  const paySymbol =
    direction === "ETH_TO_YD"
      ? ethBal.data?.symbol || "ETH"
      : ydBal.data?.symbol || "YD";
  const receiveSymbol =
    direction === "ETH_TO_YD"
      ? ydBal.data?.symbol || "YD"
      : ethBal.data?.symbol || "ETH";
  const payBalanceFmt = useMemo(() => {
    if (!payBalance) return "0";
    return direction === "ETH_TO_YD"
      ? formatEther(payBalance)
      : formatUnits(payBalance, 18);
  }, [payBalance, direction]);

  const estReceiveFmt = useMemo(() => {
    if (!estimatedReceive) return "0";
    return direction === "ETH_TO_YD"
      ? formatUnits(estimatedReceive, 18)
      : formatEther(estimatedReceive);
  }, [estimatedReceive, direction]);

  const minReceiveFmt = useMemo(() => {
    return direction === "ETH_TO_YD"
      ? formatUnits(minReceive, 18)
      : formatEther(minReceive);
  }, [minReceive, direction]);

  const priceEthToYd = Number(rate);
  const priceYdToEth = 1 / priceEthToYd;

  const actionDisabled =
    !isConnected ||
    disableSubmit ||
    !parsedPay ||
    parsedPay === 0n ||
    exceedsBalance;

  // 优化的方向切换函数
  const switchTo = (newDirection: Direction) => {
    if (newDirection === direction) return;
    
    // 批量更新状态，避免中间状态
    setIsDirectionChanging(true);
    setDirection(newDirection);
    
    // 立即清空输入，避免显示错误的解析结果
    setPayAmount("");
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>快速兑换</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <BalanceCard
            label="ETH 余额"
            value={
              ethBal.data
                ? `${Number(ethBal.data.formatted).toFixed(6)} ${
                    ethBal.data.symbol
                  }`
                : "加载中..."
            }
          />
          <BalanceCard
            label="YD 余额"
            value={
              ydBal.data
                ? `${Number(ydBal.data.formatted).toFixed(6)} ${
                    ydBal.data.symbol
                  }`
                : "加载中..."
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <Button
              size="sm"
              variant={direction === "ETH_TO_YD" ? "primary" : "ghost"}
              onClick={() => switchTo("ETH_TO_YD")}
              disabled={isDirectionChanging}
              className="transition-all duration-200"
            >
              ETH → YD
            </Button>
            <Button
              size="sm"
              variant={direction === "YD_TO_ETH" ? "primary" : "ghost"}
              onClick={() => switchTo("YD_TO_ETH")}
              disabled={isDirectionChanging}
              className="transition-all duration-200"
            >
              YD → ETH
            </Button>
          </div>
          <div className="text-xs text-neutral-500">
            汇率：1 ETH = {priceEthToYd.toLocaleString()} YD
          </div>
        </div>

        {/* 切换方向按钮 */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => switchTo(direction === "ETH_TO_YD" ? "YD_TO_ETH" : "ETH_TO_YD")}
            disabled={isDirectionChanging}
            className="w-10 h-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
          >
            <div className={`transition-transform duration-300 ${
              isDirectionChanging ? 'rotate-180' : 'rotate-0'
            }`}>
              ⇅
            </div>
          </Button>
        </div>

        <div className="space-y-2">
          <Label>支付</Label>
          <div className={`rounded-lg border p-3 transition-all duration-200 ${
            isDirectionChanging ? 'opacity-70' : 'opacity-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600 font-medium">{paySymbol}</div>
              <div className="text-xs text-neutral-500">
                余额：{Number(payBalanceFmt || 0).toFixed(6)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="flex-1 text-lg"
                disabled={isDirectionChanging}
                placeholder={isDirectionChanging ? "切换中..." : "输入金额"}
              />
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={onMax}
                disabled={isDirectionChanging || !payBalance}
              >
                最大
              </Button>
            </div>
            {!parsedPay && payAmount && !isDirectionChanging && (
              <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
            )}
            {exceedsBalance && (
              <div className="mt-1 text-xs text-red-600">余额不足</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>可得</Label>
          <div className={`rounded-lg border p-3 transition-all duration-200 ${
            isDirectionChanging ? 'opacity-70' : 'opacity-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600 font-medium">{receiveSymbol}</div>
              <div className="text-xs text-neutral-500">
                预计：{isDirectionChanging ? "计算中..." : Number(estReceiveFmt || 0).toFixed(6)}
              </div>
            </div>
            <div className="text-sm text-neutral-500">
              最小可得（滑点{(SLIPPAGE_BPS / 100).toFixed(2)}%）：
              {isDirectionChanging ? "计算中..." : `${Number(minReceiveFmt || 0).toFixed(6)} ${receiveSymbol}`}
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">价格</span>
            <span>
              1 ETH = {priceEthToYd.toLocaleString()} YD（1 YD ≈{" "}
              {priceYdToEth.toFixed(6)} ETH）
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">合约手续费</span>
            <span>0%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">滑点设置</span>
            <span>{(SLIPPAGE_BPS / 100).toFixed(2)}%</span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {direction === "YD_TO_ETH" && (
            <Button
              variant={hasAllowance ? "outline" : "secondary"}
              onClick={approveIfNeeded}
              disabled={actionDisabled || isDirectionChanging || hasAllowance}
              className={hasAllowance ? "text-green-600 border-green-200 bg-green-50" : ""}
            >
              {hasAllowance ? "✓ 已授权" : `授权 ${paySymbol}`}
            </Button>
          )}
          <Button 
            onClick={doSwap} 
            disabled={actionDisabled || !hasAllowance || isDirectionChanging}
            className="flex-1"
          >
            {isDirectionChanging ? "切换中..." : "兑换"}
          </Button>
        </div>

        {/* 授权提示信息 */}
        {direction === "YD_TO_ETH" && !hasAllowance && allowance !== undefined && (
          <div className="text-xs text-orange-600 text-center">
            需要先授权 {paySymbol} 给合约才能兑换
          </div>
        )}

        <TxStatus
          {...{
            isNetworkMismatch,
            chainId,
            expectedChainId: EXPECTED_CHAIN_ID,
            isWriting,
            txHash,
            isConfirming,
            isSuccess,
            error,
            receipt,
            explorerTxUrl,
          }}
        />
      </CardContent>
    </Card>
  );
}
