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
  const { needsApproval, allowanceQuery } = useAllowance({
    token: addresses.YDToken as `0x${string}`,
    spender: addresses.Courses as `0x${string}`,
    amount: price,
    enabled: !!address,
  });
  const hasAllowance = useMemo(() => !needsApproval, [needsApproval]);

  // 使用 onSuccess 钩子响应交易确认：
  // - 若为 approve：刷新 allowance，使“购买课程”按钮立刻可用
  // - 若为 buy：广播事件，刷新课程页面的购买状态
  const receipt = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      if (lastActionRef.current === "approve") {
        allowanceQuery.refetch?.();
      } else if (lastActionRef.current === "buy" && !firedRef.current) {
        firedRef.current = true;
        try {
          if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("course:purchased", { detail: id }));
        } catch {}
      }
    },
  });

  const approve = () => {
    lastActionRef.current = "approve";
    writeContract({
      address: addresses.YDToken as `0x${string}`,
      abi: abis.YDToken,
      functionName: "approve",
      args: [addresses.Courses as `0x${string}`, price],
    });
  };

  const buy = () => {
    lastActionRef.current = "buy";
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
      <Button variant="secondary" onClick={approve} disabled={isPending}>
        授权
      </Button>
      <Button onClick={buy} disabled={isPending || !hasAllowance}>
        购买课程
      </Button>
      {isPending && <span>等待签名...</span>}
      {receipt.isLoading && <span>交易确认中...</span>}
      {receipt.isSuccess && (
        <span>{lastActionRef.current === "buy" ? "已购买！" : "已授权！"}</span>
      )}
      {!hasAllowance && (
        <span className="text-xs text-orange-600">需先授权给合约才能购买</span>
      )}
      {error && <span className="text-red-600">{error.message}</span>}
    </div>
  );
}
