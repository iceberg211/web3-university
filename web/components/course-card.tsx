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

  const ownedFlag = Boolean(owned.data);
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="truncate">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-2 py-0.5 text-xs">{priceYD} YD</span>
            {ownedFlag && (
              <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-xs">已购买</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
          {summary}
        </p>
        <div>
          <Link href={`/course/${encodeURIComponent(id)}`}>
            <Button size="md">{ownedFlag ? "查看内容" : "购买"}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
