"use client";
import { useEffect, useState } from "react";

export type Direction = "ETH_TO_YD" | "YD_TO_ETH";

export function useSwapFormState(initial: Direction = "ETH_TO_YD") {
  const [direction, setDirection] = useState<Direction>(initial);
  const [payAmount, setPayAmount] = useState<string>("0.01");

  const switchDirection = (dir: Direction) => {
    if (dir === direction) return;
    setDirection(dir);
    // reset amount to avoid accidental large swaps across directions
    setPayAmount("0.01");
  };

  // helper flags
  const isEthToYd = direction === "ETH_TO_YD";
  const isYdToEth = direction === "YD_TO_ETH";

  return {
    direction,
    isEthToYd,
    isYdToEth,
    payAmount,
    setPayAmount,
    switchDirection,
  } as const;
}

