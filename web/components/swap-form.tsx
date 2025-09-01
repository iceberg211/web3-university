"use client";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { abis, addresses } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";

export default function SwapForm() {
  const [ethAmount, setEthAmount] = useState("0.01");
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const swap = () => {
    writeContract({
      address: addresses.MockSwap as `0x${string}`,
      abi: abis.MockSwap,
      functionName: "ethToYD",
      args: [],
      // @ts-expect-error wagmi types may not infer payable here
      value: parseEther(ethAmount),
    });
  };

  const [ydAmount, setYdAmount] = useState("0");
  const approveAndSwapBack = async () => {
    const amount = parseUnits(ydAmount || "0", 18);
    // approve to MockSwap self-transfer
    writeContract({
      address: addresses.YDToken as `0x${string}`,
      abi: abis.YDToken,
      functionName: "approve",
      args: [addresses.MockSwap as `0x${string}`, amount],
    });
    // call ydToEth
    writeContract({
      address: addresses.MockSwap as `0x${string}`,
      abi: abis.MockSwap,
      functionName: "ydToEth",
      args: [amount],
    });
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>快速兑换</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label>用 ETH 兑换 YD</Label>
          <div className="flex gap-2">
            <Input value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} />
            <Button onClick={swap} disabled={isPending}>确认兑换</Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>用 YD 兑换 ETH</Label>
          <div className="flex gap-2">
            <Input value={ydAmount} onChange={(e) => setYdAmount(e.target.value)} />
            <Button variant="secondary" onClick={approveAndSwapBack} disabled={isPending}>授权并兑换</Button>
          </div>
        </div>
        <div className="text-sm">
          {receipt.isLoading && <span className="muted">等待区块确认...</span>}
          {receipt.isSuccess && <span>成功！</span>}
          {error && <span className="text-red-600">{error.message}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
