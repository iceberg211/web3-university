"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DEFAULTS,
  TOKENS,
  useStakeAddresses,
} from "@/hooks/useStake";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useSwapOperations } from "@/hooks/useSwapOperations";
import { useAaveOperations } from "@/hooks/useAaveOperations";

// UI Components
import TokenSelector from "@/components/stake/TokenSelector";
import BalanceSection from "@/components/stake/BalanceSection";
import SwapSection from "@/components/stake/SwapSection";
import AaveSection from "@/components/stake/AaveSection";

type TokenKey = keyof typeof TOKENS;

export default function StakeForm() {
  const { address, isConnected } = useAccount();

  // Token selection state
  const [selectedToken, setSelectedToken] = useState<TokenKey>("USDT");
  const currentToken = TOKENS[selectedToken];

  // Address management with persistence
  const { 
    router, weth, usdt, link, wbtc, pool, 
    setRouter, setWeth, setUsdt, setLink, setWbtc, setPool 
  } = useStakeAddresses();

  // Current token address and setter
  const currentTokenAddress = useMemo(() => {
    switch (selectedToken) {
      case "USDT": return usdt;
      case "LINK": return link;
      case "WBTC": return wbtc;
      default: return usdt;
    }
  }, [selectedToken, usdt, link, wbtc]);

  const setCurrentTokenAddress = useCallback((address: string) => {
    switch (selectedToken) {
      case "USDT": setUsdt(address); break;
      case "LINK": setLink(address); break;
      case "WBTC": setWbtc(address); break;
      default: setUsdt(address);
    }
  }, [selectedToken, setUsdt, setLink, setWbtc]);

  // Input states
  const [ethAmount, setEthAmount] = useState("0.01");
  const [tokenAmount, setTokenAmount] = useState("");

  // Custom hooks for business logic
  const balances = useTokenBalances(address, selectedToken, currentTokenAddress);
  
  const swapOps = useSwapOperations(
    address,
    router,
    weth,
    currentTokenAddress,
    ethAmount,
    balances.ethBalance.data?.value,
    setWeth
  );

  const aaveOps = useAaveOperations(
    address,
    selectedToken,
    currentTokenAddress,
    tokenAmount,
    pool
  );

  // Computed validations
  const addressesValid = useMemo(() =>
    isAddress(router as `0x${string}`) &&
    isAddress(weth as `0x${string}`) &&
    isAddress(currentTokenAddress as `0x${string}`),
    [router, weth, currentTokenAddress]
  );

  const isValidTokenAddress = isAddress(currentTokenAddress as `0x${string}`);
  const exceedsToken = aaveOps.parsedToken && balances.tokenBalance.data?.value
    ? aaveOps.parsedToken > balances.tokenBalance.data.value
    : false;

  // Effects for balance refresh
  useEffect(() => {
    if (swapOps.swapTx.isSuccess) {
      balances.refetchAll();
    }
  }, [swapOps.swapTx.isSuccess]);

  useEffect(() => {
    if (aaveOps.approveTx.isSuccess) {
      aaveOps.allowanceQuery.refetch?.();
    }
  }, [aaveOps.approveTx.isSuccess]);

  useEffect(() => {
    if (aaveOps.supplyTx.isSuccess) {
      balances.refetchToken();
      balances.refetchAToken();
      aaveOps.allowanceQuery.refetch?.();
    }
  }, [aaveOps.supplyTx.isSuccess]);

  // Final disable conditions
  const disableSwap = swapOps.disableSwap || !addressesValid || !isConnected;
  const disableApprove = aaveOps.disableApprove || exceedsToken || !isConnected;
  const disableSupply = aaveOps.disableSupply || exceedsToken || !isConnected;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>质押（Swap ETH→{currentToken.symbol} + Aave 存入）</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        
        {/* Token Selection */}
        <TokenSelector
          selectedToken={selectedToken}
          onTokenSelect={setSelectedToken}
        />

        {/* Contract Addresses Configuration */}
        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="text-xs text-neutral-500">
            合约地址（测试网可在此自定义，确保 Router 支持 V2 接口，
            {currentToken.symbol} 为 {currentToken.decimals} 位小数）
          </div>
          <div className="grid grid-cols-1 gap-2">
            
            {/* Router Address */}
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">Router</span>
              <Input
                value={router}
                onChange={(e) => setRouter(e.target.value)}
                placeholder="UniswapV2 Router 地址"
              />
            </div>

            {/* WETH Address */}
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">WETH</span>
              <Input
                value={weth}
                onChange={(e) => setWeth(e.target.value)}
                placeholder="WETH 地址"
              />
            </div>
            {swapOps.routerWeth && (
              <div className="text-xs text-neutral-500 pl-28 -mt-1">
                Router.WETH: {swapOps.routerWeth}
                {swapOps.wethMismatch ? "（与上方不一致，已自动同步）" : ""}
              </div>
            )}

            {/* Current Token Address */}
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">{currentToken.symbol}</span>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={currentTokenAddress}
                  onChange={(e) => setCurrentTokenAddress(e.target.value)}
                  placeholder={`${currentToken.symbol} 地址（${currentToken.decimals}位小数）`}
                />
                <button
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => setCurrentTokenAddress(currentToken.address)}
                >
                  使用预置
                </button>
              </div>
            </div>

            {/* Aave Pool Address */}
            <div className="flex items-center gap-2">
              <span className="w-28 text-right text-neutral-600">Aave Pool</span>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={pool}
                  onChange={(e) => setPool(e.target.value)}
                  placeholder="Aave V3 Pool 地址"
                />
                <button
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => setPool(DEFAULTS.pool)}
                >
                  使用预置
                </button>
              </div>
            </div>
          </div>

          {/* Warning messages */}
          {swapOps.wethMismatch && (
            <div className="text-xs text-red-600 truncate whitespace-nowrap">
              警告：Router 的 WETH 与上方填写的不一致，已自动同步以避免 INVALID_PATH。
            </div>
          )}
        </div>

        {/* Pool code validation placeholder */}
        <div className="min-h-5 text-xs">
          <span className="opacity-0">.</span>
        </div>

        {/* Balance Section */}
        <BalanceSection
          selectedToken={selectedToken}
          ethBalance={balances.ethBalance}
          tokenBalance={balances.tokenBalance}
          aTokenBalance={balances.aTokenBalance}
          isValidTokenAddress={isValidTokenAddress}
        />

        {/* Swap Section */}
        <SwapSection
          selectedToken={selectedToken}
          ethAmount={ethAmount}
          onEthAmountChange={setEthAmount}
          ethBalance={balances.ethBalance}
          parsedEth={swapOps.parsedEth}
          exceedsEth={swapOps.exceedsEth}
          notEnoughForGas={swapOps.notEnoughForGas}
          gasCheckMsg={swapOps.gasCheckMsg}
          swapGasLimit={swapOps.swapGasLimit}
          swapMaxFeePerGas={swapOps.swapMaxFeePerGas}
          swapTx={swapOps.swapTx}
          onSwap={swapOps.swapEthForToken}
          disableSwap={disableSwap}
        />

        {/* Aave Section */}
        <AaveSection
          selectedToken={selectedToken}
          tokenAmount={tokenAmount}
          onTokenAmountChange={setTokenAmount}
          tokenBalance={balances.tokenBalance}
          parsedToken={aaveOps.parsedToken}
          exceedsToken={exceedsToken}
          exceedsSupplyCap={aaveOps.exceedsSupplyCap}
          supplyCapInfo={aaveOps.supplyCapInfo}
          needsApproval={aaveOps.needsApproval}
          approveTx={aaveOps.approveTx}
          supplyTx={aaveOps.supplyTx}
          onApprove={aaveOps.approveToken}
          onSupply={aaveOps.supplyToken}
          disableApprove={disableApprove}
          disableSupply={disableSupply}
        />

      </CardContent>
    </Card>
  );
}
