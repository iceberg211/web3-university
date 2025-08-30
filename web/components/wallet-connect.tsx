"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, status: cstatus, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected)
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{address}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );

  return (
    <div className="flex gap-2">
      {connectors.map((c) => (
        <button
          key={c.uid}
          className="px-3 py-1 rounded bg-black text-white"
          onClick={() => connect({ connector: c })}
        >
          Connect {c.name}
        </button>
      ))}
      {cstatus === "pending" && <span>Connecting...</span>}
      {error && <span className="text-red-600">{error.message}</span>}
    </div>
  );
}
