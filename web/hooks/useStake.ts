"use client";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { usePublicClient, useReadContract } from "wagmi";
import { UniswapV2RouterAbi } from "@/lib/defi";

export const STAKE_STORAGE_KEY = "stake.addrs.v1" as const;
export const TOKENS = {
  USDT: {
    symbol: "USDT",
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    aTokenAddress: "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6", // aUSDT
    decimals: 6,
  },
  LINK: {
    symbol: "LINK", 
    address: "0x29f2D40B0605204364af54EC677bD022dA425d03",
    aTokenAddress: "0x178a32a176F37e4b7a8DdeEF7cEc82a07FB8aF8A", // aLINK (估算，可能需要调整)
    decimals: 18,
  },
  WBTC: {
    symbol: "WBTC",
    address: "0x92f3b59a79bff5dc60c0d59ea13a44d082b2bdfc", 
    aTokenAddress: "0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF", // aWBTC
    decimals: 8,
  },
} as const;

export const DEFAULTS = {
  router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  weth: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  usdt: TOKENS.USDT.address,
  link: TOKENS.LINK.address,
  wbtc: TOKENS.WBTC.address,
  pool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
  protocolDataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
} as const;

export function useStakeAddresses() {
  const [router, setRouter] = useState<string>(DEFAULTS.router);
  const [weth, setWeth] = useState<string>(DEFAULTS.weth);
  const [usdt, setUsdt] = useState<string>(DEFAULTS.usdt);
  const [link, setLink] = useState<string>(DEFAULTS.link);
  const [wbtc, setWbtc] = useState<string>(DEFAULTS.wbtc);
  const [pool, setPool] = useState<string>(DEFAULTS.pool);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAKE_STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw) as Partial<Record<string, string>>;
        setRouter(obj.router || DEFAULTS.router);
        setWeth(obj.weth || DEFAULTS.weth);
        setUsdt(obj.usdt || DEFAULTS.usdt);
        setLink(obj.link || DEFAULTS.link);
        setWbtc(obj.wbtc || DEFAULTS.wbtc);
        setPool(obj.pool || DEFAULTS.pool);
      } else {
        setRouter(DEFAULTS.router);
        setWeth(DEFAULTS.weth);
        setUsdt(DEFAULTS.usdt);
        setLink(DEFAULTS.link);
        setWbtc(DEFAULTS.wbtc);
        setPool(DEFAULTS.pool);
      }
    } catch {
      setRouter(DEFAULTS.router);
      setWeth(DEFAULTS.weth);
      setUsdt(DEFAULTS.usdt);
      setLink(DEFAULTS.link);
      setWbtc(DEFAULTS.wbtc);
      setPool(DEFAULTS.pool);
    }
  }, []);

  useEffect(() => {
    try {
      const obj = { router, weth, usdt, link, wbtc, pool };
      localStorage.setItem(STAKE_STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }, [router, weth, usdt, link, wbtc, pool]);

  return { router, weth, usdt, link, wbtc, pool, setRouter, setWeth, setUsdt, setLink, setWbtc, setPool } as const;
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
