"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import {
  parseEther,
  parseUnits,
  formatEther,
  formatUnits,
  isAddress,
} from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTxStatus } from "@/hooks/useTxStatus";
import TxStatus from "@/components/tx-status";
import BalanceCard from "@/components/ui/balance-card";
import {
  AaveV3PoolAbi,
  AaveV3ProtocolDataProviderAbi,
  UniswapV2RouterAbi,
  Erc20Abi,
} from "@/lib/defi";
import { useAllowance } from "@/hooks/useAllowance";
import {
  DEFAULTS,
  TOKENS,
  useRouterWethSync,
  useStakeAddresses,
  useSwapGasGuard,
  useCodePresent,
} from "@/hooks/useStake";
import { useReadContract } from "wagmi";

type TokenKey = keyof typeof TOKENS;

export default function StakeForm() {
  const { address, isConnected } = useAccount();

  // 币种选择状态
  const [selectedToken, setSelectedToken] = useState<TokenKey>("USDT");
  const currentToken = TOKENS[selectedToken];

  // 1) 地址状态 + 持久化
  const {
    router,
    weth,
    usdt,
    link,
    wbtc,
    pool,
    setRouter,
    setWeth,
    setUsdt,
    setLink,
    setWbtc,
    setPool,
  } = useStakeAddresses();

  // 当前选中代币的地址和设置函数
  const currentTokenAddress = useMemo(() => {
    switch (selectedToken) {
      case "USDT":
        return usdt;
      case "LINK":
        return link;
      case "WBTC":
        return wbtc;
      default:
        return usdt;
    }
  }, [selectedToken, usdt, link, wbtc]);

  const setCurrentTokenAddress = useCallback(
    (address: string) => {
      switch (selectedToken) {
        case "USDT":
          setUsdt(address);
          break;
        case "LINK":
          setLink(address);
          break;
        case "WBTC":
          setWbtc(address);
          break;
        default:
          setUsdt(address);
      }
    },
    [selectedToken, setUsdt, setLink, setWbtc]
  );

  // Balances
  const ethBal = useBalance({ address, query: { enabled: !!address } });
  const tokenBal = useBalance({
    address,
    token: currentTokenAddress as `0x${string}`,
    query: {
      enabled: !!address && isAddress(currentTokenAddress as `0x${string}`),
    },
  });

  // aToken balance (staked amount)
  const aTokenBal = useBalance({
    address,
    token: currentToken.aTokenAddress as `0x${string}`,
    query: {
      enabled: !!address && isAddress(currentToken.aTokenAddress as `0x${string}`),
    },
  });

  // Swap ETH -> USDT
  const [ethAmount, setEthAmount] = useState("0.01");
  const swapTx = useTxStatus(undefined);

  // Aave supply token
  const [tokenAmount, setTokenAmount] = useState("");
  const approveTx = useTxStatus(undefined);
  const supplyTx = useTxStatus(undefined);

  // Parsing and guards
  const parsedEth = useMemo(() => {
    try {
      return parseEther(ethAmount || "0");
    } catch {
      return undefined;
    }
  }, [ethAmount]);

  const parsedToken = useMemo(() => {
    try {
      return parseUnits(tokenAmount || "0", currentToken.decimals);
    } catch {
      return undefined;
    }
  }, [tokenAmount, currentToken.decimals]);

  const exceedsEth = useMemo(() => {
    if (!parsedEth || !ethBal.data?.value) return false;
    return parsedEth > ethBal.data.value;
  }, [parsedEth, ethBal.data?.value]);

  const exceedsToken = useMemo(() => {
    if (!parsedToken || !tokenBal.data?.value) return false;
    return parsedToken > tokenBal.data.value;
  }, [parsedToken, tokenBal.data?.value]);

  // Auto-detect Router's canonical WETH and warn if mismatch
  const { routerWeth, wethMismatch } = useRouterWethSync(router, weth, setWeth);

  const {
    gasLimit: swapGasLimit,
    maxFeePerGas: swapMaxFeePerGas,
    estimatedCost: swapEstimatedCost,
    notEnoughForGas,
    message: gasCheckMsg,
  } = useSwapGasGuard({
    router,
    weth,
    usdt: currentTokenAddress,
    address: address as `0x${string}` | undefined,
    parsedEth,
    balance: ethBal.data?.value,
  });

  // Code presence checks (avoid no-op tx to EOAs)
  const { hasCode: poolHasCode } = useCodePresent(
    isAddress(pool as `0x${string}`) ? (pool as `0x${string}`) : undefined
  );
  const { hasCode: tokenHasCode } = useCodePresent(
    isAddress(currentTokenAddress as `0x${string}`)
      ? (currentTokenAddress as `0x${string}`)
      : undefined
  );

  const { needsApproval, allowanceQuery } = useAllowance({
    token: isAddress(currentTokenAddress as `0x${string}`)
      ? (currentTokenAddress as `0x${string}`)
      : undefined,
    spender: isAddress(pool as `0x${string}`)
      ? (pool as `0x${string}`)
      : undefined,
    amount: parsedToken,
    enabled:
      !!address &&
      isAddress(currentTokenAddress as `0x${string}`) &&
      isAddress(pool as `0x${string}`) &&
      !!parsedToken,
  });

  // Query supply caps and current supply data
  const reserveCapsQuery = useReadContract({
    address: DEFAULTS.protocolDataProvider as `0x${string}`,
    abi: AaveV3ProtocolDataProviderAbi,
    functionName: "getReserveCaps",
    args: [currentTokenAddress as `0x${string}`],
    query: {
      enabled: isAddress(currentTokenAddress as `0x${string}`),
    },
  });

  const reserveDataQuery = useReadContract({
    address: DEFAULTS.protocolDataProvider as `0x${string}`,
    abi: AaveV3ProtocolDataProviderAbi,
    functionName: "getReserveData",
    args: [currentTokenAddress as `0x${string}`],
    query: {
      enabled: isAddress(currentTokenAddress as `0x${string}`),
    },
  });

  const supplyCap = reserveCapsQuery.data?.[1]; // supplyCap is the second return value
  const totalAToken = reserveDataQuery.data?.[2]; // totalAToken is the third return value

  const exceedsSupplyCap = useMemo(() => {
    if (!parsedToken || !supplyCap || !totalAToken) return false;
    if (supplyCap === 0n) return false; // No cap means unlimited
    const availableSupply = supplyCap - totalAToken;
    return parsedToken > availableSupply;
  }, [parsedToken, supplyCap, totalAToken]);

  // Actions
  const swapEthForToken = async () => {
    if (!parsedEth || parsedEth === 0n) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
    const amountOutMin = 0n; // NOTE: for production, compute with slippage protection
    try {
      await swapTx.writeTx({
        address: router as `0x${string}`,
        abi: UniswapV2RouterAbi,
        functionName: "swapExactETHForTokens",
        args: [
          amountOutMin,
          [weth as `0x${string}`, currentTokenAddress as `0x${string}`],
          (address as `0x${string}`) || (weth as `0x${string}`),
          deadline,
        ],
        // @ts-expect-error: wagmi writeContract supports value on payable
        value: parsedEth,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const approveToken = async () => {
    if (!parsedToken || parsedToken === 0n) return;
    try {
      await approveTx.writeTx({
        address: currentTokenAddress as `0x${string}`,
        abi: Erc20Abi,
        functionName: "approve",
        args: [pool as `0x${string}`, parsedToken],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const supplyToken = async () => {
    if (!parsedToken || parsedToken === 0n) return;
    try {
      await supplyTx.writeTx({
        address: pool as `0x${string}`,
        abi: AaveV3PoolAbi,
        functionName: "deposit",
        args: [
          currentTokenAddress as `0x${string}`,
          parsedToken,
          (address as `0x${string}`) || (currentTokenAddress as `0x${string}`),
          0,
        ],
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh balances after successful actions
  useEffect(() => {
    if (swapTx.isSuccess) {
      ethBal.refetch?.();
      tokenBal.refetch?.();
    }
  }, [swapTx.isSuccess, ethBal, tokenBal]);

  useEffect(() => {
    if (approveTx.isSuccess) {
      allowanceQuery.refetch?.();
    }
  }, [approveTx.isSuccess, allowanceQuery]);

  useEffect(() => {
    if (supplyTx.isSuccess) {
      tokenBal.refetch?.();
      aTokenBal.refetch?.();
      allowanceQuery.refetch?.();
    }
  }, [supplyTx.isSuccess, tokenBal, aTokenBal, allowanceQuery]);

  // gas 预估已抽离到 useSwapGasGuard

  const addressesValid =
    isAddress(router as `0x${string}`) &&
    isAddress(weth as `0x${string}`) &&
    isAddress(currentTokenAddress as `0x${string}`);
  const poolValid = isAddress(pool as `0x${string}`);
  const disableSwap =
    !isConnected ||
    swapTx.disableSubmit ||
    !parsedEth ||
    parsedEth === 0n ||
    exceedsEth ||
    !addressesValid ||
    notEnoughForGas ||
    wethMismatch;
  const disableApprove =
    !isConnected ||
    approveTx.disableSubmit ||
    !parsedToken ||
    parsedToken === 0n ||
    exceedsToken ||
    exceedsSupplyCap ||
    !isAddress(currentTokenAddress as `0x${string}`) ||
    !poolValid ||
    tokenHasCode === false;
  const disableSupply =
    !isConnected ||
    supplyTx.disableSubmit ||
    !parsedToken ||
    parsedToken === 0n ||
    exceedsToken ||
    exceedsSupplyCap ||
    needsApproval ||
    !isAddress(currentTokenAddress as `0x${string}`) ||
    !poolValid ||
    poolHasCode === false ||
    tokenHasCode === false;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>
          质押（Swap ETH→{currentToken.symbol} + Aave 存入）
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Token Selection */}
        <div className="space-y-2">
          <Label>选择代币</Label>
          <div className="flex gap-2">
            {(Object.keys(TOKENS) as TokenKey[]).map((tokenKey) => (
              <Button
                key={tokenKey}
                size="sm"
                variant={selectedToken === tokenKey ? "default" : "secondary"}
                onClick={() => setSelectedToken(tokenKey)}
                className="min-w-16"
              >
                {TOKENS[tokenKey].symbol}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="text-xs text-neutral-500">
            合约地址（测试网可在此自定义，确保 Router 支持 V2 接口，
            {currentToken.symbol} 为 {currentToken.decimals}
            位小数）
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">Router</span>
              <Input
                value={router}
                onChange={(e) => setRouter(e.target.value)}
                placeholder="UniswapV2 Router 地址"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">WETH</span>
              <Input
                value={weth}
                onChange={(e) => setWeth(e.target.value)}
                placeholder="WETH 地址"
              />
            </div>
            {routerWeth && (
              <div className="text-xs text-neutral-500 pl-28 -mt-1">
                Router.WETH: {routerWeth}
                {wethMismatch ? "（与上方不一致，已自动同步）" : ""}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">
                {currentToken.symbol}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={currentTokenAddress}
                  onChange={(e) => setCurrentTokenAddress(e.target.value)}
                  placeholder={`${currentToken.symbol} 地址（${currentToken.decimals}位小数）`}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentTokenAddress(currentToken.address)}
                >
                  使用预置
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">
                Aave Pool
              </span>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={pool}
                  onChange={(e) => setPool(e.target.value)}
                  placeholder="Aave V3 Pool 地址"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPool(DEFAULTS.pool)}
                >
                  使用预置
                </Button>
              </div>
            </div>
          </div>
          {wethMismatch && (
            <div className="text-xs text-red-600 truncate whitespace-nowrap">
              警告：Router 的 WETH 与上方填写的不一致，已自动同步以避免
              INVALID_PATH。
            </div>
          )}
        </div>
        {/* 保留状态区高度，防止警告占位影响整体布局 */}
        <div className="min-h-5 text-xs">
          {poolHasCode === false ? (
            <div className="text-red-600 truncate whitespace-nowrap">
              警告：Aave Pool
              地址在当前网络上不是合约，交易会无效，请填写测试网有效的 Aave Pool
              地址。
            </div>
          ) : (
            <span className="opacity-0">.</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <BalanceCard
            label="ETH 余额"
            value={
              ethBal.data
                ? `${Number(ethBal.data.formatted).toFixed(4)} ${
                    ethBal.data.symbol
                  }`
                : "加载中..."
            }
          />
          <BalanceCard
            label={`${currentToken.symbol} 余额`}
            value={
              !isAddress(currentTokenAddress as `0x${string}`)
                ? "地址无效"
                : tokenBal.isError
                ? "读取失败"
                : tokenBal.data
                ? `${Number(tokenBal.data.formatted).toFixed(4)} ${
                    tokenBal.data.symbol || currentToken.symbol
                  }`
                : "加载中..."
            }
          />
          <BalanceCard
            label={`a${currentToken.symbol} 质押`}
            value={
              aTokenBal.isError
                ? "读取失败"
                : aTokenBal.data
                ? `${Number(aTokenBal.data.formatted).toFixed(4)} ${
                    aTokenBal.data.symbol || `a${currentToken.symbol}`
                  }`
                : "0.0000"
            }
            className={Number(aTokenBal.data?.formatted || 0) > 0 ? "border-green-200 bg-green-50" : ""}
          />
        </div>

        {/* Swap ETH -> Token */}
        <div className="space-y-2">
          <Label>用 ETH 兑换 {currentToken.symbol}（Uniswap V2）</Label>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600">ETH</div>
              <div className="text-xs text-neutral-500">
                余额：
                {ethBal.data ? Number(ethBal.data.formatted).toFixed(6) : "0"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                className="flex-1 text-lg"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setEthAmount(
                    ethBal.data
                      ? Math.max(
                          Number(ethBal.data.formatted) - 0.005,
                          0
                        ).toFixed(6)
                      : "0"
                  )
                }
              >
                最大
              </Button>
            </div>
            {!parsedEth && (
              <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
            )}
            {exceedsEth && (
              <div className="mt-1 text-xs text-red-600">余额不足</div>
            )}
            {notEnoughForGas && (
              <div className="mt-1 text-xs text-red-600">
                {gasCheckMsg || "兑换金额 + 预估 gas 超出余额"}
              </div>
            )}
            {swapGasLimit && swapMaxFeePerGas && (
              <div className="mt-1 text-xs text-neutral-500">
                预估手续费：
                {Number(formatEther(swapGasLimit * swapMaxFeePerGas)).toFixed(
                  6
                )}{" "}
                ETH
              </div>
            )}
          </div>
          <div className="text-xs text-neutral-500">
            提示：演示默认
            amountOutMin=0，生产环境请加入预估与滑点保护。测试网请确保
            Router/WETH/{currentToken.symbol} 存在并有流动性。
          </div>
          <Button onClick={swapEthForToken} disabled={disableSwap}>
            用 Uniswap 兑换
          </Button>
          <TxStatus {...swapTx} showNetworkWarning={false} />
        </div>

        {/* Aave Supply */}
        <div className="space-y-2">
          <Label>将 {currentToken.symbol} 存入 Aave（V3 Pool）</Label>
          {supplyCap && totalAToken && (
            <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded">
              供应上限：
              {Number(formatUnits(supplyCap, currentToken.decimals)).toFixed(0)}{" "}
              {currentToken.symbol} | 已使用：
              {Number(formatUnits(totalAToken, currentToken.decimals)).toFixed(
                2
              )}{" "}
              {currentToken.symbol} | 可用：
              {Number(
                formatUnits(supplyCap - totalAToken, currentToken.decimals)
              ).toFixed(2)}{" "}
              {currentToken.symbol}
            </div>
          )}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-600">
                {currentToken.symbol}
              </div>
              <div className="text-xs text-neutral-500">
                余额：
                {tokenBal.data
                  ? Number(tokenBal.data.formatted).toFixed(6)
                  : "0"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="flex-1 text-lg"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setTokenAmount(
                    tokenBal.data
                      ? Number(tokenBal.data.formatted).toFixed(6)
                      : "0"
                  )
                }
              >
                最大
              </Button>
            </div>
            {!parsedToken && (
              <div className="mt-1 text-xs text-red-600">请输入有效的数量</div>
            )}
            {exceedsToken && (
              <div className="mt-1 text-xs text-red-600">余额不足</div>
            )}
            {exceedsSupplyCap && (
              <div className="mt-1 text-xs text-red-600">
                超出 Aave 协议供应上限，当前可存入：
                {supplyCap && totalAToken
                  ? Number(
                      formatUnits(
                        supplyCap - totalAToken,
                        currentToken.decimals
                      )
                    ).toFixed(6)
                  : "0"}{" "}
                {currentToken.symbol}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant={needsApproval ? "secondary" : "outline"}
              onClick={approveToken}
              disabled={disableApprove || !needsApproval}
              className={needsApproval ? "" : "text-green-600 border-green-200 bg-green-50"}
            >
              {needsApproval
                ? `授权 ${currentToken.symbol}`
                : `✓ 已授权 ${currentToken.symbol}`}
            </Button>
            <Button onClick={supplyToken} disabled={disableSupply}>
              存入 Aave
            </Button>
          </div>
          {/* 显示授权和存入的交易状态 */}
          {approveTx.hash && <TxStatus {...approveTx} showNetworkWarning={false} />}
          {supplyTx.hash && <TxStatus {...supplyTx} showNetworkWarning={false} />}
          
          {/* 质押成功提示 */}
          {supplyTx.isSuccess && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                🎉 <strong>质押成功！</strong>
              </div>
              <div className="text-xs text-green-600 mt-1">
                • 您已成功将 {currentToken.symbol} 存入 Aave 协议<br/>
                • 您获得了对应的 a{currentToken.symbol} 代币作为存款凭证<br/>
                • a{currentToken.symbol} 余额会随时间增长，反映您赚取的利息<br/>
                • 您可以随时使用 a{currentToken.symbol} 赎回本金和利息
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
