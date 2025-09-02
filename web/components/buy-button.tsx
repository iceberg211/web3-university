"use client";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { parseUnits, stringToHex, keccak256 } from "viem";
import Button from "@/components/ui/button";

export default function BuyButton({ id, priceYD }: { id: string; priceYD: string }) {
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const idHex = keccak256(stringToHex(id)) as `0x${string}`;
  const price = parseUnits(priceYD, 18);

  // For simplicity, we skip pre-checking allowance here.

  const approve = () => {
    writeContract({
      address: addresses.YDToken as `0x${string}`,
      abi: abis.YDToken,
      functionName: "approve",
      args: [addresses.Courses as `0x${string}`, price],
    });
  };

  const buy = () => {
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
      <Button onClick={buy} disabled={isPending}>
        购买课程
      </Button>
      {isPending && <span>等待签名...</span>}
      {receipt.isLoading && <span>交易确认中...</span>}
      {receipt.isSuccess && <span>已购买！</span>}
      {error && <span className="text-red-600">{error.message}</span>}
    </div>
  );
}
