import contracts from "../contracts/abis.json" assert { type: "json" };
import addrs11155111 from "../contracts/11155111.json" assert { type: "json" };
// Prefer synced addresses.json if present; fallback to sepolia file
// Note: Typed as any to keep flexibility across networks
let synced: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  synced = require("../contracts/addresses.json");
} catch {}

type Abi = readonly unknown[];
export const abis = contracts as Record<string, Abi>;

export const addresses = (synced.addresses as Record<string, string>) || (addrs11155111 as { addresses: Record<string, string> }).addresses;
