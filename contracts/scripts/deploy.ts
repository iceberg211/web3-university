import { ethers } from "hardhat";
import { formatEther, parseUnits } from "ethers";
import { mkdirSync, writeFileSync } from "fs";
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

  // 3) (Optional) Deploy MockSwap and seed with YD so ethToYD works on testnet
  const MockSwap = await ethers.getContractFactory("MockSwap");
  const mockSwap = await MockSwap.deploy(ydAddress);
  console.log("MockSwap tx:", mockSwap.deploymentTransaction()?.hash);
  await mockSwap.waitForDeployment();
  const mockSwapAddress = await mockSwap.getAddress();
  console.log("MockSwap deployed at:", mockSwapAddress);

  // Seed MockSwap with some YD so users can swap ETH->YD in demos
  try {
    const seedAmount = parseUnits("1000000", 18); // 1,000,000 YD
    const tx = await (await YD.attach(ydAddress)).connect(deployer).mint(mockSwapAddress, seedAmount);
    console.log("Seed MockSwap YD tx:", tx.hash);
    await tx.wait();
  } catch (e) {
    console.warn("Warning: Failed to mint YD to MockSwap (is deployer owner?)", e);
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
