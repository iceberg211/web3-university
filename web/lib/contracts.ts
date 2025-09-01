import contracts from "../contracts/abis.json" assert { type: "json" };
import addrsJson from "../contracts/11155111.json" assert { type: "json" };

type Abi = readonly unknown[];
export const abis = contracts as Record<string, Abi>;
export const addresses = (addrsJson as { addresses: Record<string, string> }).addresses;
