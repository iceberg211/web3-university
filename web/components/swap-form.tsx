"use client";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { abis, addresses } from "@/lib/contracts";

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
    <div className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="block text-sm">用 ETH 兑换 YD</label>
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
          />
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={swap}
            disabled={isPending}
          >
            确认兑换
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm">用 YD 兑换 ETH</label>
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            value={ydAmount}
            onChange={(e) => setYdAmount(e.target.value)}
          />
          <button
            className="px-3 py-1 bg-purple-600 text-white rounded"
            onClick={approveAndSwapBack}
            disabled={isPending}
          >
            Approve+兑换
          </button>
        </div>
      </div>
      {receipt.isLoading && <span>等待区块确认...</span>}
      {receipt.isSuccess && <span>成功！</span>}
      {error && <span className="text-red-600">{error.message}</span>}
    </div>
  );
}
