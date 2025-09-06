"use client";
import { useParams } from "next/navigation";
import BuyButton from "@/components/buy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourse, useOwnedCourse } from "@/hooks/useCourse";
import { useReadContract } from "wagmi";
import { keccak256, stringToHex } from "viem";
import { addresses, abis } from "@/lib/contracts";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { course, isLoading, error } = useCourse(id);
  const owned = useOwnedCourse(id);
  const idHex = id ? (keccak256(stringToHex(id)) as `0x${string}`) : undefined;
  const onchain = useReadContract({
    address: addresses.Courses as `0x${string}`,
    abi: abis.Courses,
    functionName: "courses",
    args: idHex ? [idHex] : undefined,
    query: { enabled: !!idHex },
  });

  if (isLoading)
    return <div className="text-sm text-muted-foreground">加载课程中...</div>;
  if (error)
    return (
      <div className="text-sm text-red-600">加载失败：{error.message}</div>
    );
  if (!course) return <div>课程不存在</div>;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="truncate">{course.title}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="rounded-full border px-2 py-0.5 text-xs">
                {course.priceYD} YD
              </span>
              {owned.data && (
                <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
                  已购买
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {course.summary}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">作者</span>
              <span className="font-mono text-xs">
                {(onchain.data as any)?.[1]?.slice?.(0, 6)}...
                {(onchain.data as any)?.[1]?.slice?.(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">价格</span>
              <span>{course.priceYD} YD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">购买状态</span>
              <span>{owned.data ? "已购买" : "未购买"}</span>
            </div>
          </div>
          {!owned.data ? (
            <div className="space-y-3">
              <BuyButton id={course.id} priceYD={course.priceYD} />
              {owned.isLoading && <p className="muted">查询购买状态中...</p>}
            </div>
          ) : (
            <article className="prose">
              <p>欢迎回来！你已购买本课程。</p>
              <p>{course.summary}</p>
            </article>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
