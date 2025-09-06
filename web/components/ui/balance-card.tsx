"use client";
export default function BalanceCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-md border p-3 ${className}`}>
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

