"use client";
import { useAccount, useReadContract } from "wagmi";
import { isAddress } from "viem";
import { AaveV3PoolAbi } from "@/lib/defi";

export function useAllowance({
  token,
  owner,
  spender,
  amount,
  enabled = true,
}: {
  token: `0x${string}` | undefined;
  owner?: `0x${string}` | undefined;
  spender: `0x${string}` | undefined;
  amount?: bigint | undefined;
  enabled?: boolean;
}) {
  const account = useAccount();
  const ownerAddr = owner || (account.address as `0x${string}` | undefined);
  const valid = Boolean(
    enabled && token && spender && ownerAddr && isAddress(token) && isAddress(spender) && isAddress(ownerAddr)
  );
  const allowanceQuery = useReadContract({
    address: (token || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: AaveV3PoolAbi,
    functionName: "allowance",
    args: [
      (ownerAddr || "0x0000000000000000000000000000000000000000") as `0x${string}`,
      (spender || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    query: { enabled: valid },
  });

  const allowance = (allowanceQuery.data as bigint | undefined) ?? undefined;
  // Only consider approval state when we have a positive amount to check
  const canCheck = Boolean(amount !== undefined && amount > 0n && valid);
  const isApproved = Boolean(
    canCheck && allowance !== undefined && amount !== undefined && amount <= allowance
  );
  const needsApproval = Boolean(
    canCheck && allowance !== undefined && amount !== undefined && amount > allowance
  );

  return { allowanceQuery, allowance, canCheck, isApproved, needsApproval } as const;
}
