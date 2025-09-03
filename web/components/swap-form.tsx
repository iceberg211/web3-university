"use client";
import { useMemo, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { abis, addresses } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";
import { useTxStatus } from "@/hooks/useTxStatus";

export default function SwapForm() {
  const { address, isConnected } = useAccount();
  const ethBal = useBalance({ address, query: { enabled: !!address } });
  const ydBal = useBalance({
    address,
    token: addresses.YDToken as `0x${string}`,
    query: { enabled: !!address },
  });
  const [ethAmount, setEthAmount] = useState("0.01");
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

  const parsedEthAmount = useMemo(() => {
    try {
      return parseEther(ethAmount || "0");
    } catch {
      return undefined;
    }
  }, [ethAmount]);
  const exceedsEthBalance = useMemo(() => {
    if (!parsedEthAmount || !ethBal.data) return false;
    return parsedEthAmount > ethBal.data.value;
  }, [parsedEthAmount, ethBal.data]);
  const swap = async () => {
    if (!parsedEthAmount || parsedEthAmount === 0n) return;
    try {
      await writeTx({
        address: addresses.MockSwap as `0x${string}`,
        abi: abis.MockSwap,
        functionName: "ethToYD",
        args: [],
        // @ts-expect-error wagmi may not infer payable
        value: parsedEthAmount,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const [ydAmount, setYdAmount] = useState("0");
  const parsedYdAmount = useMemo(() => {
    try {
      return parseUnits(ydAmount || "0", 18);
    } catch {
      return undefined;
    }
  }, [ydAmount]);
  const exceedsYdBalance = useMemo(() => {
    if (!parsedYdAmount || !ydBal.data) return false;
    return parsedYdAmount > ydBal.data.value;
  }, [parsedYdAmount, ydBal.data]);
  const approveAndSwapBack = async () => {
    if (!parsedYdAmount || parsedYdAmount === 0n) return;
    try {
      await writeTx({
        address: addresses.YDToken as `0x${string}`,
        abi: abis.YDToken,
        functionName: "approve",
        args: [addresses.MockSwap as `0x${string}`, parsedYdAmount],
      });
      await writeTx({
        address: addresses.MockSwap as `0x${string}`,
        abi: abis.MockSwap,
        functionName: "ydToEth",
        args: [parsedYdAmount],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>快速兑换</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="text-sm text-muted-foreground">
          {isConnected ? (
            <div className="flex flex-col gap-1">
              <span>
                ETH 余额：
                {ethBal.data
                  ? `${ethBal.data.formatted} ${ethBal.data.symbol}`
                  : "加载中..."}
              </span>
              <span>
                YD 余额：
                {ydBal.data
                  ? `${ydBal.data.formatted} ${ydBal.data.symbol}`
                  : "加载中..."}
              </span>
            </div>
          ) : (
            <span>请先连接钱包以查看余额</span>
          )}
        </div>
        <div className="space-y-2">
          <Label>用 ETH 兑换 YD</Label>
          <div className="flex gap-2">
            <Input
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
            />
            <Button
              onClick={swap}
              disabled={
                !isConnected ||
                disableSubmit ||
                !parsedEthAmount ||
                parsedEthAmount === 0n ||
                exceedsEthBalance
              }
            >
              确认兑换
            </Button>
          </div>
          {!parsedEthAmount && (
            <div className="text-xs text-red-600">请输入有效的 ETH 数量</div>
          )}
          {exceedsEthBalance && (
            <div className="text-xs text-red-600">余额不足</div>
          )}
        </div>

        <div className="space-y-2">
          <Label>用 YD 兑换 ETH</Label>
          <div className="flex gap-2">
            <Input
              value={ydAmount}
              onChange={(e) => setYdAmount(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={approveAndSwapBack}
              disabled={
                !isConnected ||
                disableSubmit ||
                !parsedYdAmount ||
                parsedYdAmount === 0n ||
                exceedsYdBalance
              }
            >
              授权并兑换
            </Button>
          </div>
          {!parsedYdAmount && (
            <div className="text-xs text-red-600">请输入有效的 YD 数量</div>
          )}
          {exceedsYdBalance && (
            <div className="text-xs text-red-600">余额不足</div>
          )}
        </div>
        <div className="text-sm">
          {isNetworkMismatch && (
            <div className="text-orange-600">
              当前网络 {chainId} 与期望网络 {EXPECTED_CHAIN_ID}{" "}
              不一致，请切换网络
            </div>
          )}
          {isWriting && <span className="muted">等待钱包签名...</span>}
          {txHash && !isSuccess && (
            <span className="muted">
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
            </span>
          )}
          {isConfirming && <span className="muted">等待区块确认...</span>}
          {isSuccess && (
            <span>成功！区块 #{receipt.data?.blockNumber?.toString?.()}</span>
          )}
          {isError && (
            <span className="text-red-600">
              {String(error?.message || receipt.error?.message || "未知错误")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
