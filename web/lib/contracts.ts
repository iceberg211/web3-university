import contracts from "../../contracts/exports/abis.json" assert { type: "json" };
import addrsJson from "../../contracts/exports/31337.json" assert { type: "json" };

type Abi = readonly unknown[];
export const abis = contracts as Record<string, Abi>;
export const addresses = (addrsJson as { addresses: Record<string, string> }).addresses;
