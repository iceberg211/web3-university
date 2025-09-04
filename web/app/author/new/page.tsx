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
  const [priceTouched, setPriceTouched] = useState(false);
  const { address, isConnected } = useAccount();
  const EXPECTED_CHAIN_ID = Number(
    process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"
  );
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

  const priceValid = useMemo(() => {
    try {
      return parseUnits(price || "0", 18) > 0n;
    } catch {
      return false;
    }
  }, [price]);

  const canCreate =
    isConnected &&
    !disableSubmit &&
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    priceValid;

  const create = async () => {
    const id = crypto.randomUUID();
    // Persist metadata via Supabase (SSR/home reads from Supabase)
    try {
      await supabase
        .from("courses")
        .insert({ id, title, summary, priceYD: price });
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
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>创建课程</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>课程标题</Label>
            <Input
              placeholder="例如：从零到一：Web3 入门指南"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="text-xs text-neutral-500">{title.length}/80</div>
          </div>
          <div className="space-y-2">
            <Label>课程简介</Label>
            <Textarea
              placeholder="一句话说明课程亮点、适合人群与预期产出"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <div className="text-xs text-neutral-500">{summary.length}/300</div>
          </div>
          <div className="space-y-2">
            <Label>课程价格（YD）</Label>
            <Input
              placeholder="例如：10"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (!priceTouched) setPriceTouched(true);
              }}
              onBlur={() => setPriceTouched(true)}
              inputMode="decimal"
            />
            {priceTouched && !priceValid ? (
              <div className="text-xs text-red-600">
                请输入有效价格（大于0）
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={create} disabled={!canCreate}>
              创建课程
            </Button>
            {isNetworkMismatch && (
              <p className="text-orange-600">
                当前网络 {chainId} 与期望网络 {EXPECTED_CHAIN_ID}{" "}
                不一致，请在钱包中切换网络。
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
              <p>已创建！区块 #{receipt.data?.blockNumber?.toString?.()}</p>
            )}
            {isError && (
              <p className="text-red-600">
                交易确认失败：
                {String(error?.message || receipt.error?.message || "未知错误")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>创建须知</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-neutral-600 dark:text-neutral-300">
          <p>创建课程会进行两步操作：</p>
          <p>
            1) 向数据库写入课程元数据（标题、简介、价格）；2) 向链上 Courses
            合约写入课程 ID 与价格、作者地址。
          </p>
          <p>
            价格单位为
            YD，用户购买时将按该价格支付，平台会自动收取少量手续费（已在合约中设定）。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
