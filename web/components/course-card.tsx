"use client";
import { useAccount, useReadContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { stringToHex, keccak256 } from "viem";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CourseCard({
  id,
  title,
  summary,
  priceYD,
}: {
  id: string;
  title: string;
  summary: string;
  priceYD: string;
}) {
  const { address } = useAccount();
  const idHex = keccak256(stringToHex(id)) as `0x${string}`;

  // 读取合约
  const owned = useReadContract({
    address: addresses.Courses as `0x${string}`,
    abi: abis.Courses,
    functionName: "hasPurchased",
    args: [idHex, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {summary}
        </p>
        <div className="text-sm">价格：{priceYD} YD</div>
        <div>
          <Link href={`/course/${encodeURIComponent(id)}`}>
            <Button size="md">{owned.data ? "查看内容" : "购买"}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
