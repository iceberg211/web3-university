import { verifyMessage } from "viem";

export type SignedAction = {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
};

export function parseSignedMessage(message: string) {
  // Expect multi-line message with fields: App, Action, Address, Timestamp
  const lines = message.split(/\r?\n/).map((s) => s.trim());
  const map: Record<string, string> = {};
  for (const l of lines) {
    const i = l.indexOf(":");
    if (i > 0) {
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim();
      map[k] = v;
    }
  }
  return map as { App?: string; Action?: string; Address?: string; Timestamp?: string };
}

export async function verifySignedAction({ address, message, signature }: SignedAction, expectAction: string) {
  const ok = await verifyMessage({ address, message, signature });
  if (!ok) return { ok: false, error: "INVALID_SIGNATURE" } as const;
  const m = parseSignedMessage(message);
  if (!m.Action || m.Action !== expectAction) return { ok: false, error: "INVALID_ACTION" } as const;
  if (!m.Address || m.Address.toLowerCase() !== address.toLowerCase()) return { ok: false, error: "ADDRESS_MISMATCH" } as const;
  // Optional freshness window: 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const ts = Number(m.Timestamp || 0);
  if (!ts || Math.abs(now - ts) > 300) return { ok: false, error: "STALE_SIGNATURE" } as const;
  return { ok: true } as const;
}

