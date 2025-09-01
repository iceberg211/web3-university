"use client";
import { useParams } from "next/navigation";
import { loadCourses } from "@/lib/storage";
import { useAccount, useReadContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import BuyButton from "@/components/buy-button";
import { stringToHex } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const course = loadCourses().find((c) => c.id === id);
  const { address } = useAccount();
  const idHex = stringToHex(id) as `0x${string}`;
  const owned = useReadContract({
    address: addresses.Courses as `0x${string}`,
    abi: abis.Courses,
    functionName: "hasPurchased",
    args: [idHex, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  if (!course) return <div>课程不存在</div>;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!owned.data ? (
            <div className="space-y-3">
              <p className="text-red-600">未购买，无权限查看内容。</p>
              <BuyButton id={course.id} priceYD={course.priceYD} />
            </div>
          ) : (
            <article className="prose">
              <p>{course.summary}</p>
              <p>这里展示课程内容（存储在 Web2/localStorage）。</p>
            </article>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
