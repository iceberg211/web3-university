"use client";
import { useMemo, useState } from "react";
import { abis, addresses } from "@/lib/contracts";
import { useAccount } from "wagmi";
import { parseUnits, stringToHex, keccak256 } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Label from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import Button from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useTxStatus } from "@/hooks/useTxStatus";

export default function NewCourse() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [price, setPrice] = useState("10");
  const { address, isConnected } = useAccount();
  const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");
  const {
    writeTx,
    txHash,
    chainId,
    isWriting,
    isConfirming,
    isSuccess,
    isError,
    error,
    receipt,
    explorerTxUrl,
    disableSubmit,
    isNetworkMismatch,
  } = useTxStatus(EXPECTED_CHAIN_ID);

  const create = async () => {
    const id = crypto.randomUUID();
    // Persist metadata via Supabase (SSR/home reads from Supabase)
    try {
      await supabase.from("courses").insert({ id, title, summary, priceYD: price });
    } catch {}

    // Use bytes32 id on-chain: keccak256(string) to ensure fixed 32 bytes
    const idHex = keccak256(stringToHex(id)) as `0x${string}`;
    try {
      await writeTx({
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
    } catch (e) {
      // 用户拒签或调用报错
      console.error(e);
    }
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
            <Button onClick={create} disabled={!isConnected || disableSubmit}>
              创建课程
            </Button>
            {isNetworkMismatch && (
              <p className="text-orange-600">
                当前网络 {chainId} 与期望网络 {EXPECTED_CHAIN_ID} 不一致，请在钱包中切换网络。
              </p>
            )}
            {isWriting && <p className="muted">等待钱包签名...</p>}
            {txHash && !isSuccess && (
              <p className="muted">
                交易已提交：{txHash.slice(0, 10)}... 等待确认...
                {explorerTxUrl && (
                  <a
                    href={explorerTxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline ml-2"
                  >
                    在 Etherscan 查看
                  </a>
                )}
              </p>
            )}
            {isConfirming && <p className="muted">链上写入中...</p>}
            {isSuccess && (
              <p>
                已创建！区块 #{receipt.data?.blockNumber?.toString?.()}
              </p>
            )}
            {isError && (
              <p className="text-red-600">
                交易确认失败：{String(error?.message || receipt.error?.message || "未知错误")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
