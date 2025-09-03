"use client";
import { useEffect, useMemo, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect, useReadContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { parseUnits, stringToHex, keccak256 } from "viem";
import Button from "@/components/ui/button";

export default function BuyButton({ id, priceYD }: { id: string; priceYD: string }) {
  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  // 购买成功后，广播事件，方便课程详情刷新权限状态（仅在 buy 成功时发）
  const firedRef = useRef(false);
  const lastActionRef = useRef<"approve" | "buy" | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!receipt.isSuccess || firedRef.current) return;
    if (lastActionRef.current !== "buy") return; // 仅 buy 成功才广播
    firedRef.current = true;
    try {
      window.dispatchEvent(new CustomEvent("course:purchased", { detail: id }));
    } catch {}
  }, [receipt.isSuccess, id]);

  const idHex = keccak256(stringToHex(id)) as `0x${string}`;
  const price = parseUnits(priceYD, 18);

  // 读取当前 allowance，若不足则提示需先授权
  const allowanceQuery = useReadContract({
    address: addresses.YDToken as `0x${string}`,
    abi: abis.YDToken,
    functionName: "allowance",
    args: [
      (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
      addresses.Courses as `0x${string}`,
    ],
    query: { enabled: !!address },
  });
  const hasAllowance = useMemo(() => {
    const a = allowanceQuery.data as bigint | undefined;
    if (a === undefined) return false;
    return a >= price;
  }, [allowanceQuery.data, price]);

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
