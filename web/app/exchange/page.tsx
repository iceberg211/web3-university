import SwapForm from "@/components/swap-form";
import WalletConnect from "@/components/wallet-connect";

export default function ExchangePage() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">兑换 YD 币</h1>
        <WalletConnect />
      </header>
      <SwapForm />
    </div>
  );
}

