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
    <Card className="flex flex-col hover-lift group h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 text-lg group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full border border-neutral-200 dark:border-neutral-700 px-3 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800">
              {priceYD} YD
            </span>
            {ownedFlag && (
              <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 text-xs font-medium">
                已购买
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        {ownedFlag ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
            {summary}
          </p>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            购买后解锁课程简介和内容
          </p>
        )}
        <div className="mt-auto">
          <Link href={`/course/${encodeURIComponent(id)}`} className="block">
            <Button size="md" className="w-full">
              {ownedFlag ? "查看内容" : "购买课程"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
