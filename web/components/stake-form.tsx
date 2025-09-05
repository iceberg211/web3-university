"use client";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits, isAddress } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTxStatus } from "@/hooks/useTxStatus";
import {
  UNISWAP_V2_ROUTER02,
  WETH,
  USDT,
  AAVE_V3_POOL,
  UniswapV2RouterAbi,
  Erc20Abi,
  AavePoolAbi,
} from "@/lib/defi";

export default function StakeForm() {
  const { address, isConnected } = useAccount();

  // Editable contract addresses for testnets
  const [router, setRouter] = useState<string>("");
  const [weth, setWeth] = useState<string>("");
  const [usdt, setUsdt] = useState<string>("");
  const [pool, setPool] = useState<string>("");

  // Balances
  const ethBal = useBalance({ address, query: { enabled: !!address } });
  const usdtBal = useBalance({
    address,
    token: (usdt || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    query: { enabled: !!address && Boolean(usdt) && isAddress(usdt as `0x${string}`) },
  });

  // Swap ETH -> USDT
  const [ethAmount, setEthAmount] = useState("0.01");
  const swapTx = useTxStatus(undefined);

  // Aave supply USDT
  const [usdtAmount, setUsdtAmount] = useState("");
  const aaveTx = useTxStatus(undefined);

  // USDT allowance to Aave Pool
  const allowanceQuery = useReadContract({
    address: (usdt || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: Erc20Abi,
    functionName: "allowance",
    args: [
      (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
      (pool || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    query: { enabled: !!address && isAddress(usdt as `0x${string}`) && isAddress(pool as `0x${string}`) },
  });

  // Parsing and guards
  const parsedEth = useMemo(() => {
    try {
      return parseEther(ethAmount || "0");
    } catch {
      return undefined;
    }
  }, [ethAmount]);

  const parsedUsdt = useMemo(() => {
    try {
      return parseUnits(usdtAmount || "0", 6);
    } catch {
      return undefined;
    }
  }, [usdtAmount]);

  const exceedsEth = useMemo(() => {
    if (!parsedEth || !ethBal.data?.value) return false;
    return parsedEth > ethBal.data.value;
  }, [parsedEth, ethBal.data?.value]);

  const exceedsUsdt = useMemo(() => {
    if (!parsedUsdt || !usdtBal.data?.value) return false;
    return parsedUsdt > usdtBal.data.value;
  }, [parsedUsdt, usdtBal.data?.value]);

  const needsApproval = useMemo(() => {
    const allowance = (allowanceQuery.data as bigint | undefined) ?? 0n;
    if (!parsedUsdt || parsedUsdt === 0n) return false;
    return parsedUsdt > allowance;
  }, [allowanceQuery.data, parsedUsdt]);

  // Actions
  const swapEthForUsdt = async () => {
    if (!parsedEth || parsedEth === 0n) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
    const amountOutMin = 0n; // NOTE: for production, compute with slippage protection
    try {
      await swapTx.writeTx({
        address: router as `0x${string}`,
        abi: UniswapV2RouterAbi,
        functionName: "swapExactETHForTokens",
        args: [amountOutMin, [weth as `0x${string}`, usdt as `0x${string}`], (address as `0x${string}`) || (weth as `0x${string}`), deadline],
        // @ts-expect-error: wagmi writeContract supports value on payable
        value: parsedEth,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const approveUsdt = async () => {
    if (!parsedUsdt || parsedUsdt === 0n) return;
    try {
      await aaveTx.writeTx({
        address: usdt as `0x${string}`,
        abi: Erc20Abi,
        functionName: "approve",
        args: [pool as `0x${string}`, parsedUsdt],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const supplyUsdt = async () => {
    if (!parsedUsdt || parsedUsdt === 0n) return;
    try {
      await aaveTx.writeTx({
        address: pool as `0x${string}`,
        abi: AavePoolAbi,
        functionName: "supply",
        args: [usdt as `0x${string}`, parsedUsdt, (address as `0x${string}`) || (usdt as `0x${string}`), 0],
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh balances after successful actions
  useEffect(() => {
    if (swapTx.isSuccess) {
      ethBal.refetch?.();
      usdtBal.refetch?.();
    }
  }, [swapTx.isSuccess]);

  useEffect(() => {
    if (aaveTx.isSuccess) {
      usdtBal.refetch?.();
    }
  }, [aaveTx.isSuccess]);

  const addressesValid = isAddress(router as `0x${string}`) && isAddress(weth as `0x${string}`) && isAddress(usdt as `0x${string}`);
  const poolValid = isAddress(pool as `0x${string}`);
  const disableSwap = !isConnected || swapTx.disableSubmit || !parsedEth || parsedEth === 0n || exceedsEth || !addressesValid;
  const disableApprove = !isConnected || aaveTx.disableSubmit || !parsedUsdt || parsedUsdt === 0n || exceedsUsdt || !isAddress(usdt as `0x${string}`) || !poolValid;
  const disableSupply = !isConnected || aaveTx.disableSubmit || !parsedUsdt || parsedUsdt === 0n || exceedsUsdt || needsApproval || !isAddress(usdt as `0x${string}`) || !poolValid;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>质押（Swap ETH→USDT + Aave 存入）</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="text-xs text-neutral-500">合约地址（测试网可在此自定义，确保 Router 支持 V2 接口，USDT 为 6 位小数）</div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">Router</span>
              <Input value={router} onChange={(e) => setRouter(e.target.value)} placeholder="UniswapV2 Router 地址" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">WETH</span>
              <Input value={weth} onChange={(e) => setWeth(e.target.value)} placeholder="WETH 地址" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">USDT</span>
              <Input value={usdt} onChange={(e) => setUsdt(e.target.value)} placeholder="USDT 地址（6位小数）" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">Aave Pool</span>
              <Input value={pool} onChange={(e) => setPool(e.target.value)} placeholder="Aave V3 Pool 地址" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-xs text-neutral-500 mb-1">ETH 余额</div>
            <div className="text-lg font-medium">
              {ethBal.data ? `${Number(ethBal.data.formatted).toFixed(6)} ${ethBal.data.symbol}` : "加载中..."}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-neutral-500 mb-1">USDT 余额</div>
            <div className="text-lg font-medium">
              {!isAddress(usdt as `0x${string}`)
                ? "请先填写有效的 USDT 合约地址"
                : usdtBal.isError
                  ? "读取失败，请确认地址与网络"
                  : usdtBal.data
                    ? `${Number(usdtBal.data.formatted).toFixed(6)} ${usdtBal.data.symbol || "USDT"}`
                    : "加载中..."}
            </div>
          </div>
        </div>

        {/* Swap ETH -> USDT */}
        <div className="space-y-2">
          <Label>用 ETH 兑换 USDT（Uniswap V2）</Label>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600">ETH</div>
              <div className="text-xs text-neutral-500">余额：{ethBal.data ? Number(ethBal.data.formatted).toFixed(6) : "0"}</div>
            </div>
            <div className="flex items-center gap-3">
              <Input value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} className="flex-1 text-lg" />
              <Button size="sm" variant="secondary" onClick={() => setEthAmount(ethBal.data ? Math.max(Number(ethBal.data.formatted) - 0.001, 0).toFixed(6) : "0")}>
                最大
              </Button>
            </div>
            {!parsedEth && <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>}
            {exceedsEth && <div className="mt-1 text-xs text-red-600">余额不足</div>}
          </div>
          <div className="text-xs text-neutral-500">提示：演示默认 amountOutMin=0，生产环境请加入预估与滑点保护。测试网请确保 Router/WETH/USDT 存在并有流动性。</div>
          <Button onClick={swapEthForUsdt} disabled={disableSwap}>用 Uniswap 兑换</Button>
          <TxStatus {...swapTx} />
        </div>

        {/* Aave Supply */}
        <div className="space-y-2">
          <Label>将 USDT 存入 Aave（V3 Pool）</Label>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600">USDT</div>
              <div className="text-xs text-neutral-500">余额：{usdtBal.data ? Number(usdtBal.data.formatted).toFixed(6) : "0"}</div>
            </div>
            <div className="flex items-center gap-3">
              <Input value={usdtAmount} onChange={(e) => setUsdtAmount(e.target.value)} className="flex-1 text-lg" />
              <Button size="sm" variant="secondary" onClick={() => setUsdtAmount(usdtBal.data ? Number(usdtBal.data.formatted).toFixed(6) : "0")}>
                最大
              </Button>
            </div>
            {!parsedUsdt && <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>}
            {exceedsUsdt && <div className="mt-1 text-xs text-red-600">余额不足</div>}
          </div>

          <div className="flex gap-2 items-center">
            {needsApproval && (
              <Button variant="secondary" onClick={approveUsdt} disabled={disableApprove}>
                授权 USDT
              </Button>
            )}
            <Button onClick={supplyUsdt} disabled={disableSupply}>
              存入 Aave
            </Button>
          </div>
          <TxStatus {...aaveTx} />
        </div>
      </CardContent>
    </Card>
  );
}

function TxStatus(props: ReturnType<typeof useTxStatus>) {
  const { isNetworkMismatch, chainId, expectedChainId, isWriting, txHash, isConfirming, isSuccess, error, receipt, explorerTxUrl } = props;
  return (
    <div className="text-sm">
      {/* 取消网络强校验，便于在测试网使用 */}
      {isWriting && <span className="muted">等待钱包签名...</span>}
      {txHash && !isSuccess && (
        <span className="muted">
          交易已提交：{txHash.slice(0, 10)}... 等待确认...
          {explorerTxUrl && (
            <a href={explorerTxUrl} target="_blank" rel="noreferrer" className="underline ml-2">
              在 Etherscan 查看
            </a>
          )}
        </span>
      )}
      {isConfirming && <span className="muted">等待区块确认...</span>}
      {isSuccess && (
        <span>成功！区块 #{receipt.data?.blockNumber?.toString?.()}</span>
      )}
      {props.isError && (
        <span className="text-red-600">{String(error?.message || receipt.error?.message || "未知错误")}</span>
      )}
    </div>
  );
}
