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
  const ethBal = useBalance({ address, query: { enabled: !!address } });
  const ydBal = useBalance({
    address,
    token: addresses.YDToken as `0x${string}`,
    query: { enabled: !!address },
  });
  const [direction, setDirection] = useState<Direction>("ETH_TO_YD");
  const [payAmount, setPayAmount] = useState("0.01");
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

  // 读取汇率（合约常量）
  const rateQuery = useReadContract({
    address: addresses.MockSwap as `0x${string}`,
    abi: abis.MockSwap,
    functionName: "RATE",
  });
  const rate = (rateQuery.data as bigint | undefined) ?? 4000n; // 兜底

  // 读取 YD allowance（当 YD -> ETH 时需要授权）
  const { allowanceQuery, needsApproval } = useAllowance({
    token: addresses.YDToken as `0x${string}`,
    spender: addresses.MockSwap as `0x${string}`,
    amount: direction === "YD_TO_ETH" ? parsedPay : undefined,
    enabled: !!address,
  });

  // 解析输入与余额校验
  const parsedPay = useMemo(() => {
    try {
      if (direction === "ETH_TO_YD") return parseEther(payAmount || "0");
      return parseUnits(payAmount || "0", 18);
    } catch {
      return undefined;
    }
  }, [payAmount, direction]);

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

  // Max 按钮：为 ETH 预留gas
  const onMax = () => {
    const bal = payBalance ?? 0n;
    let max = bal;
    if (direction === "ETH_TO_YD") {
      max = bal > GAS_BUFFER_WEI ? bal - GAS_BUFFER_WEI : 0n;
      setPayAmount(formatEther(max));
    } else {
      setPayAmount(formatUnits(max, 18));
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

  // 当切换方向时，重置金额为 0.01，避免误操作
  useEffect(() => {
    setPayAmount("0.01");
  }, [direction]);

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

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>快速兑换</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <BalanceCard label="ETH 余额" value={ethBal.data ? `${Number(ethBal.data.formatted).toFixed(6)} ${ethBal.data.symbol}` : "加载中..."} />
          <BalanceCard label="YD 余额" value={ydBal.data ? `${Number(ydBal.data.formatted).toFixed(6)} ${ydBal.data.symbol}` : "加载中..."} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-sm">
            <Button
              size="sm"
              variant={direction === "ETH_TO_YD" ? "default" : "secondary"}
              onClick={() => setDirection("ETH_TO_YD")}
            >
              ETH → YD
            </Button>
            <Button
              size="sm"
              variant={direction === "YD_TO_ETH" ? "default" : "secondary"}
              onClick={() => setDirection("YD_TO_ETH")}
            >
              YD → ETH
            </Button>
          </div>
          <div className="text-xs text-neutral-500">
            汇率：1 ETH = {priceEthToYd.toLocaleString()} YD（合约）
          </div>
        </div>

        <div className="space-y-2">
          <Label>支付</Label>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600">{paySymbol}</div>
              <div className="text-xs text-neutral-500">
                余额：{Number(payBalanceFmt || 0).toFixed(6)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="flex-1 text-lg"
              />
              <Button size="sm" variant="secondary" onClick={onMax}>
                最大
              </Button>
            </div>
            {!parsedPay && (
              <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
            )}
            {exceedsBalance && (
              <div className="mt-1 text-xs text-red-600">余额不足</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>可得</Label>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600">{receiveSymbol}</div>
              <div className="text-xs text-neutral-500">
                预计：{Number(estReceiveFmt || 0).toFixed(6)}
              </div>
            </div>
            <div className="text-sm text-neutral-500">
              最小可得（滑点{(SLIPPAGE_BPS / 100).toFixed(2)}%）：
              {Number(minReceiveFmt || 0).toFixed(6)} {receiveSymbol}
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
          {needsApproval && (
            <Button
              variant="secondary"
              onClick={approveIfNeeded}
              disabled={actionDisabled}
            >
              授权 {paySymbol}
            </Button>
          )}
          <Button onClick={doSwap} disabled={actionDisabled || needsApproval}>
            兑换
          </Button>
        </div>

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
