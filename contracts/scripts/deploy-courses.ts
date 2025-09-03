import { artifacts, ethers } from "hardhat";
import { mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync } from "fs";
import path from "path";

function isAddressLike(v?: string): v is string {
  return !!v && /^0x[a-fA-F0-9]{40}$/.test(v);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log("Network:", network.name || chainId);
  console.log("Deployer:", deployer.address);

  // Resolve YD token address: prefer env, otherwise try exports/<chainId>.json
  const exportsDir = path.join(__dirname, "..", "exports");
  const existingAddrsFile = path.join(exportsDir, `${chainId}.json`);
  let ydTokenAddress = process.env.YD_TOKEN_ADDRESS;
  if (!isAddressLike(ydTokenAddress) && existsSync(existingAddrsFile)) {
    try {
      const json = JSON.parse(readFileSync(existingAddrsFile, "utf8"));
      const maybe = json?.addresses?.YDToken as string | undefined;
      if (isAddressLike(maybe)) ydTokenAddress = maybe;
    } catch {}
  }
  if (!isAddressLike(ydTokenAddress)) {
    throw new Error(
      "Missing YD token address. Set env YD_TOKEN_ADDRESS or generate exports/<chainId>.json with YDToken first."
    );
  }

  // Fee config
  const owner = isAddressLike(process.env.OWNER_ADDRESS)
    ? (process.env.OWNER_ADDRESS as `0x${string}`)
    : (deployer.address as `0x${string}`);
  const feeRecipient = isAddressLike(process.env.FEE_RECIPIENT_ADDRESS)
    ? (process.env.FEE_RECIPIENT_ADDRESS as `0x${string}`)
    : (deployer.address as `0x${string}`);
  const feeBps = Number(process.env.FEE_BPS ?? 500);
  if (!(feeBps >= 0 && feeBps <= 1000)) {
    throw new Error("FEE_BPS must be between 0 and 1000");
  }

  // Deploy Courses
  const Courses = await ethers.getContractFactory("Courses");
  const courses = await Courses.deploy(ydTokenAddress as `0x${string}`, owner, feeRecipient, feeBps);
  console.log("Courses tx:", courses.deploymentTransaction()?.hash);
  await courses.waitForDeployment();
  const coursesAddress = await courses.getAddress();
  console.log("Courses deployed at:", coursesAddress);

  // Merge + write addresses to exports/<chainId>.json
  mkdirSync(exportsDir, { recursive: true });
  let payload: any = { addresses: { chainId } };
  if (existsSync(existingAddrsFile)) {
    try {
      payload = JSON.parse(readFileSync(existingAddrsFile, "utf8"));
    } catch {}
    payload.addresses = payload.addresses || {};
    payload.addresses.chainId = chainId;
  }
  payload.addresses.Courses = coursesAddress;
  // keep existing YDToken/MockSwap if any
  if (!payload.addresses.YDToken) payload.addresses.YDToken = ydTokenAddress;
  const outFile = existingAddrsFile;
  writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Wrote addresses to exports/${chainId}.json`);

  // Export ABIs to exports/abis.json (just like export-abi)
  const names = ["YDToken", "MockSwap", "Courses"];
  const abis: Record<string, any> = {};
  for (const n of names) {
    try {
      const art = await artifacts.readArtifact(n);
      abis[n] = art.abi;
    } catch {
      // If artifact not found (e.g., MockSwap omitted), skip
    }
  }
  const abisFile = path.join(exportsDir, `abis.json`);
  writeFileSync(abisFile, JSON.stringify(abis, null, 2));
  console.log("Exported ABIs to exports/abis.json");

  // Sync to web/contracts
  const webContractsDir = path.join(__dirname, "..", "..", "web", "contracts");
  mkdirSync(webContractsDir, { recursive: true });
  copyFileSync(abisFile, path.join(webContractsDir, "abis.json"));
  copyFileSync(outFile, path.join(webContractsDir, `${chainId}.json`));
  copyFileSync(outFile, path.join(webContractsDir, `addresses.json`));
  console.log("Synced contracts to web/contracts/ (ABIs + addresses)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

