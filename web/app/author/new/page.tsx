"use client";
import { useState } from "react";
import { saveCourses, loadCourses } from "@/lib/storage";
import { abis, addresses } from "@/lib/contracts";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseUnits } from "viem";

export default function NewCourse() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [price, setPrice] = useState("10");
  const { address } = useAccount();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const create = () => {
    const id = crypto.randomUUID();
    const stored = loadCourses();
    stored.push({ id, title, summary, priceYD: price });
    saveCourses(stored);

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
    <div className="p-6 space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">创建课程</h1>
      <label className="block">课程标题</label>
      <input
        className="border rounded w-full px-2 py-1"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label className="block">课程简介</label>
      <textarea
        className="border rounded w-full px-2 py-1"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <label className="block">课程价格（YD）</label>
      <input
        className="border rounded w-full px-2 py-1"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button
        className="px-3 py-1 bg-green-600 text-white rounded"
        onClick={create}
        disabled={isPending}
      >
        创建课程
      </button>
      {receipt.isLoading && <p>链上写入中...</p>}
      {receipt.isSuccess && <p>已创建！</p>}
      {error && <p className="text-red-600">{error.message}</p>}
    </div>
  );
}
