import SwapForm from "@/components/swap-form";
import StakeForm from "@/components/stake-form";

export default function ExchangePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">兑换 YD 币</h1>
      <SwapForm />
      <div className="pt-2">
        <h2 className="text-xl font-semibold tracking-tight mb-2">质押</h2>
        <StakeForm />
      </div>
    </div>
  );
}
