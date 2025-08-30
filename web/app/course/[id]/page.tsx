"use client";
import { useParams } from "next/navigation";
import { loadCourses } from "@/lib/storage";
import { useAccount, useReadContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import BuyButton from "@/components/buy-button";
import { stringToHex } from "viem";

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

  if (!course) return <div className="p-6">课程不存在</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{course.title}</h1>
      {!owned.data ? (
        <div className="space-y-2">
          <p className="text-red-600">未购买，无权限查看内容。</p>
          <BuyButton id={course.id} priceYD={course.priceYD} />
        </div>
      ) : (
        <article className="prose">
          <p>{course.summary}</p>
          <p>这里展示课程内容（存储在Web2/localStorage）。</p>
        </article>
      )}
    </div>
  );
}
