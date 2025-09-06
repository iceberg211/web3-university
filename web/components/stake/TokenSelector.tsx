"use client";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { TOKENS } from "@/hooks/useStake";

type TokenKey = keyof typeof TOKENS;

interface TokenSelectorProps {
  selectedToken: TokenKey;
  onTokenSelect: (token: TokenKey) => void;
}

export default function TokenSelector({ selectedToken, onTokenSelect }: TokenSelectorProps) {
  const tokenKeys = Object.keys(TOKENS) as TokenKey[];
  
  return (
    <div className="space-y-2">
      <Label>选择代币</Label>
      <div className="flex gap-2">
        {tokenKeys.map((tokenKey) => (
          <Button
            key={tokenKey}
            size="sm"
            variant={selectedToken === tokenKey ? "secondary" : "default"}
            onClick={() => onTokenSelect(tokenKey)}
            className="min-w-16"
          >
            {TOKENS[tokenKey].symbol}
          </Button>
        ))}
      </div>
    </div>
  );
}