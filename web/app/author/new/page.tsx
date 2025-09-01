"use client";
import { useState } from "react";
import { abis, addresses } from "@/lib/contracts";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Label from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function NewCourse() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [price, setPrice] = useState("10");
  const { address } = useAccount();

  // 使用写合约
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const create = () => {
    const id = crypto.randomUUID();
    // Persist course in SQLite via API
    fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, summary, priceYD: price }),
    }).catch(() => {});

    const idHex = `0x${Buffer.from(id).toString("hex")}` as `0x${string}`;
    writeContract({
      address: addresses.Courses as `0x${string}`,
      abi: abis.Courses,
      functionName: "createCourse",
      args: [
        idHex,
        parseUnits(price, 18),
        (address ||
          "0x0000000000000000000000000000000000000000") as `0x${string}`,
      ],
    });
  };

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>创建课程</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>课程标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>课程简介</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>课程价格（YD）</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={create} disabled={isPending}>创建课程</Button>
            {receipt.isLoading && <p className="muted">链上写入中...</p>}
            {receipt.isSuccess && <p>已创建！</p>}
            {error && <p className="text-red-600">{error.message}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
