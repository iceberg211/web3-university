import contracts from "../contracts/abis.json" assert { type: "json" };
import addrs31337 from "../contracts/31337.json" assert { type: "json" };
import addrs11155111 from "../contracts/11155111.json" assert { type: "json" };

type Abi = readonly unknown[];
export const abis = contracts as Record<string, Abi>;

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "31337";
const source = CHAIN_ID === "11155111" ? addrs11155111 : addrs31337;

export const addresses = (source as { addresses: Record<string, string> }).addresses;
