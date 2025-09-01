import { ethers } from "hardhat";
import { mkdirSync, copyFileSync, existsSync } from "fs";
import path from "path";

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  const exportsDir = path.join(__dirname, "..", "exports");
  const webContractsDir = path.join(__dirname, "..", "..", "web", "contracts");
  mkdirSync(webContractsDir, { recursive: true });

  const srcAbis = path.join(exportsDir, "abis.json");
  const srcAddrs = path.join(exportsDir, `${chainId}.json`);

  if (!existsSync(srcAbis)) {
    throw new Error(`Missing ${srcAbis}. Run: pnpm --filter @web3-university/contracts export-abi`);
  }

  // Always sync ABIs
  copyFileSync(srcAbis, path.join(webContractsDir, "abis.json"));

  // Optionally sync addresses if available
  if (existsSync(srcAddrs)) {
    copyFileSync(srcAddrs, path.join(webContractsDir, `${chainId}.json`));
    copyFileSync(srcAddrs, path.join(webContractsDir, `addresses.json`));
    console.log(`Synced ABIs and addresses (chainId ${chainId}) to web/contracts/`);
  } else {
    console.warn(`Warning: ${srcAddrs} not found. Synced ABIs only.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

