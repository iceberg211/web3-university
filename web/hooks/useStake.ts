"use client";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { usePublicClient, useReadContract } from "wagmi";
import { UniswapV2RouterAbi } from "@/lib/defi";

export const STAKE_STORAGE_KEY = "stake.addrs.v1" as const;
export const DEFAULTS = {
  router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  weth: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
  usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
  pool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
} as const;

export function useStakeAddresses() {
  const [router, setRouter] = useState<string>(DEFAULTS.router);
  const [weth, setWeth] = useState<string>(DEFAULTS.weth);
  const [usdt, setUsdt] = useState<string>(DEFAULTS.usdt);
  const [pool, setPool] = useState<string>(DEFAULTS.pool);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAKE_STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw) as Partial<Record<string, string>>;
        setRouter(obj.router || DEFAULTS.router);
        setWeth(obj.weth || DEFAULTS.weth);
        setUsdt(obj.usdt || DEFAULTS.usdt);
        setPool(obj.pool || DEFAULTS.pool);
      } else {
        setRouter(DEFAULTS.router);
        setWeth(DEFAULTS.weth);
        setUsdt(DEFAULTS.usdt);
        setPool(DEFAULTS.pool);
      }
    } catch {
      setRouter(DEFAULTS.router);
      setWeth(DEFAULTS.weth);
      setUsdt(DEFAULTS.usdt);
      setPool(DEFAULTS.pool);
    }
  }, []);

  useEffect(() => {
    try {
      const obj = { router, weth, usdt, pool };
      localStorage.setItem(STAKE_STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }, [router, weth, usdt, pool]);

  return { router, weth, usdt, pool, setRouter, setWeth, setUsdt, setPool } as const;
}

export function useRouterWethSync(router: string, weth: string, setWeth: (a: string) => void) {
  const routerWethQuery = useReadContract({
    address: (router || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: UniswapV2RouterAbi,
    functionName: "WETH",
    query: { enabled: isAddress(router as `0x${string}`) },
  });
  const routerWeth = (routerWethQuery.data as `0x${string}` | undefined) || undefined;
  const wethMismatch = Boolean(
    routerWeth && isAddress(weth as `0x${string}`) && routerWeth.toLowerCase() !== (weth as string).toLowerCase()
  );
  useEffect(() => {
    if (routerWeth && (!weth || wethMismatch)) setWeth(routerWeth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerWeth]);
  return { routerWeth, wethMismatch } as const;
}

export function useSwapGasGuard({
  router,
  weth,
  usdt,
  address,
  parsedEth,
  balance,
}: {
  router: string;
  weth: string;
  usdt: string;
  address?: `0x${string}`;
  parsedEth?: bigint;
  balance?: bigint;
}) {
  const pc = usePublicClient();
  const [gasLimit, setGasLimit] = useState<bigint | null>(null);
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setMessage(null);
        setGasLimit(null);
        setMaxFeePerGas(null);
        if (!pc) return;
        if (!address || !isAddress(router as `0x${string}`) || !isAddress(weth as `0x${string}`) || !isAddress(usdt as `0x${string}`)) return;
        if (!parsedEth || parsedEth === 0n) return;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
        const gas = await pc.estimateContractGas({
          account: address,
          address: router as `0x${string}`,
          abi: UniswapV2RouterAbi,
          functionName: "swapExactETHForTokens",
          args: [0n, [weth as `0x${string}`, usdt as `0x${string}`], address, deadline],
          value: parsedEth,
        });
        setGasLimit(gas);
        const fees = await pc.estimateFeesPerGas();
        const maxFee = fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
        setMaxFeePerGas(maxFee);
        if (balance) {
          const total = parsedEth + gas * maxFee;
          if (total > balance) setMessage("余额不足以覆盖兑换金额 + 预估 gas，请减少兑换数量");
        }
      } catch {
        // ignore estimation errors
      }
    })();
  }, [pc, address, router, weth, usdt, parsedEth, balance]);

  const estimatedCost = useMemo(() => {
    if (!gasLimit || !maxFeePerGas) return null as bigint | null;
    return gasLimit * maxFeePerGas;
  }, [gasLimit, maxFeePerGas]);

  const notEnoughForGas = useMemo(() => {
    if (!parsedEth || !balance || !estimatedCost) return false;
    return parsedEth + estimatedCost > balance;
  }, [parsedEth, balance, estimatedCost]);

  return { gasLimit, maxFeePerGas, estimatedCost, notEnoughForGas, message } as const;
}

export function useCodePresent(address?: `0x${string}`) {
  const pc = usePublicClient();
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        setHasCode(null);
        if (!pc) return;
        if (!address || !isAddress(address)) { setHasCode(false); return; }
        const code = await pc.getBytecode({ address });
        setHasCode(Boolean(code && code !== "0x"));
      } catch {
        setHasCode(false);
      }
    })();
  }, [pc, address]);
  return { hasCode } as const;
}
