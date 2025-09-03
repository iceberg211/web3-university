import { artifacts, ethers } from "hardhat";
import { formatEther, parseUnits } from "ethers";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log("Network:", network.name || chainId);
  console.log("Deployer:", deployer.address);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", formatEther(bal), "ETH");
  if (bal === 0n) {
    console.warn("Warning: Deployer has 0 balance. Fund it before deploying.");
  }

  // 1) Deploy YDToken
  const YD = await ethers.getContractFactory("YDToken");
  const yd = await YD.deploy(deployer.address);
  console.log("YDToken tx:", yd.deploymentTransaction()?.hash);
  await yd.waitForDeployment();
  const ydAddress = await yd.getAddress();
  console.log("YDToken deployed at:", ydAddress);

  // 2) Deploy Courses (owner = deployer, feeRecipient = deployer, feeBps = 500 = 5%)
  const Courses = await ethers.getContractFactory("Courses");
  const feeBps = 500;
  const courses = await Courses.deploy(ydAddress, deployer.address, deployer.address, feeBps);
  console.log("Courses tx:", courses.deploymentTransaction()?.hash);
  await courses.waitForDeployment();
  const coursesAddress = await courses.getAddress();
  console.log("Courses deployed at:", coursesAddress);

  // 3) Deploy MockSwap
  const MockSwap = await ethers.getContractFactory("MockSwap");
  const mockSwap = await MockSwap.deploy(ydAddress);
  console.log("MockSwap tx:", mockSwap.deploymentTransaction()?.hash);
  await mockSwap.waitForDeployment();
  const mockSwapAddress = await mockSwap.getAddress();
  console.log("MockSwap deployed at:", mockSwapAddress);

  // Optional: seed MockSwap with YD for ETH->YD demo
  // Set SEED_SWAP_YD to a numeric string (in whole tokens) to enable, e.g. "1000000"
  const seedStr = process.env.SEED_SWAP_YD;
  if (seedStr && Number(seedStr) > 0) {
    try {
      const seedAmount = parseUnits(seedStr, 18);
      const tx = await (await (await ethers.getContractFactory("YDToken")).attach(ydAddress)).connect(deployer).mint(mockSwapAddress, seedAmount);
      console.log(`Seeded MockSwap with ${seedStr} YD. tx:`, tx.hash);
      await tx.wait();
    } catch (e) {
      console.warn("Warning: Failed to mint YD to MockSwap (is deployer owner?)", e);
    }
  } else {
    console.log("Skip seeding MockSwap YD (set SEED_SWAP_YD to enable).");
  }

  // 4) Write addresses to exports/<chainId>.json
  const outDir = path.join(__dirname, "..", "exports");
  mkdirSync(outDir, { recursive: true });
  const payload = {
    addresses: {
      chainId,
      YDToken: ydAddress,
      MockSwap: mockSwapAddress,
      Courses: coursesAddress,
    },
  };
  const outFile = path.join(outDir, `${chainId}.json`);
  writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Wrote addresses to exports/${chainId}.json`);

  // 5) Export ABIs to exports/abis.json (same as export-abi script)
  const names = ["YDToken", "MockSwap", "Courses"];
  const abis: Record<string, any> = {};
  for (const n of names) {
    const art = await artifacts.readArtifact(n);
    abis[n] = art.abi;
  }
  const abisFile = path.join(outDir, `abis.json`);
  writeFileSync(abisFile, JSON.stringify(abis, null, 2));
  console.log("Exported ABIs to exports/abis.json");

  // 6) Sync ABIs and addresses to web/contracts (auto front-end sync)
  const webContractsDir = path.join(__dirname, "..", "..", "web", "contracts");
  mkdirSync(webContractsDir, { recursive: true });
  copyFileSync(abisFile, path.join(webContractsDir, "abis.json"));
  if (existsSync(outFile)) {
    copyFileSync(outFile, path.join(webContractsDir, `${chainId}.json`));
    copyFileSync(outFile, path.join(webContractsDir, `addresses.json`));
  }
  console.log("Synced contracts to web/contracts/ (ABIs + addresses)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
