"use client";
import { useEffect, useMemo, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { useAllowance } from "@/hooks/useAllowance";
import { parseUnits, stringToHex, keccak256 } from "viem";
import Button from "@/components/ui/button";

export default function BuyButton({
  id,
  priceYD,
}: {
  id: string;
  priceYD: string;
}) {
  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  // 最近一次动作类型（区分 approve / buy）
  const lastActionRef = useRef<"approve" | "buy" | null>(null);
  const firedRef = useRef(false);

  const idHex = keccak256(stringToHex(id)) as `0x${string}`;
  const price = parseUnits(priceYD, 18);

  // 通用 allowance hook
  const { needsApproval, allowance, allowanceQuery } = useAllowance({
    token: addresses.YDToken as `0x${string}`,
    spender: addresses.Courses as `0x${string}`,
    amount: price,
    enabled: !!address,
  });
  
  // 修复授权状态判断逻辑
  const hasAllowance = useMemo(() => {
    if (allowance === undefined) {
      // 数据还在加载中，默认认为没有授权
      return false;
    }
    const sufficient = allowance >= price;
    console.log("BuyButton - allowance check:", {
      allowance: allowance.toString(),
      price: price.toString(),
      sufficient,
      needsApproval
    });
    return sufficient;
  }, [allowance, price, needsApproval]);

  // 监听交易状态
  const receipt = useWaitForTransactionReceipt({
    hash,
  });

  // 使用 useEffect 监听交易成功事件
  useEffect(() => {
    if (receipt.isSuccess && hash) {
      if (lastActionRef.current === "approve") {
        console.log("授权交易成功，刷新 allowance");
        // 延迟一点刷新，确保链上状态已更新
        setTimeout(() => {
          allowanceQuery.refetch?.();
        }, 1000);
      } else if (lastActionRef.current === "buy" && !firedRef.current) {
        firedRef.current = true;
        console.log("购买交易成功，广播事件");
        try {
          if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("course:purchased", { detail: id }));
        } catch {}
      }
    }
  }, [receipt.isSuccess, hash, lastActionRef.current, allowanceQuery, id]);

  const approve = () => {
    lastActionRef.current = "approve";
    firedRef.current = false; // 重置事件触发标志
    writeContract({
      address: addresses.YDToken as `0x${string}`,
      abi: abis.YDToken,
      functionName: "approve",
      args: [addresses.Courses as `0x${string}`, price],
    });
  };

  const buy = () => {
    lastActionRef.current = "buy";
    firedRef.current = false; // 重置事件触发标志
    writeContract({
      address: addresses.Courses as `0x${string}`,
      abi: abis.Courses,
      functionName: "buyCourse",
      args: [idHex],
    });
  };

  if (!isConnected)
    return (
      <Button onClick={() => connect({ connector: connectors[0] })}>
        连接钱包
      </Button>
    );

  return (
    <div className="flex gap-2 items-center">
      <Button 
        variant={hasAllowance ? "outline" : "secondary"}
        onClick={approve} 
        disabled={isPending || hasAllowance}
        className={hasAllowance ? "text-green-600 border-green-200 bg-green-50" : ""}
      >
        {hasAllowance ? "✓ 已授权" : "授权"}
      </Button>
      <Button onClick={buy} disabled={isPending || !hasAllowance}>
        购买课程
      </Button>
      {isPending && <span>等待签名...</span>}
      {receipt.isLoading && <span>交易确认中...</span>}
      {receipt.isSuccess && (
        <span>{lastActionRef.current === "buy" ? "已购买！" : "已授权！"}</span>
      )}
      {!hasAllowance && allowance !== undefined && (
        <span className="text-xs text-orange-600">需先授权给合约才能购买</span>
      )}
      {error && <span className="text-red-600">{error.message}</span>}
    </div>
  );
}
