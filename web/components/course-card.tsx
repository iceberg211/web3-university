"use client";
import { useAccount, useReadContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { stringToHex } from "viem";
import Link from "next/link";

export default function CourseCard({ id, title, summary, priceYD }: { id: string; title: string; summary: string; priceYD: string }) {
  const { address } = useAccount();
  const idHex = stringToHex(id) as `0x${string}`;
  const owned = useReadContract({
    address: addresses.Courses as `0x${string}`,
    abi: abis.Courses,
    functionName: "hasPurchased",
    args: [idHex, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  return (
    <div className="border rounded p-4 flex flex-col gap-2">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600">{summary}</div>
      <div className="text-sm">价格: {priceYD} YD</div>
      <div className="flex gap-2">
        <Link href={`/course/${encodeURIComponent(id)}`} className="px-3 py-1 bg-blue-600 text-white rounded">
          {owned.data ? "查看内容" : "购买"}
        </Link>
      </div>
    </div>
  );
}
