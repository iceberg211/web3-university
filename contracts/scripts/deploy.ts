import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const YD = await ethers.getContractFactory("YDToken");
  const yd = await YD.deploy(deployer.address);
  await yd.waitForDeployment();

  const Swap = await ethers.getContractFactory("MockSwap");
  const swap = await Swap.deploy(await yd.getAddress());
  await swap.waitForDeployment();

  // Fund swap with YD for redemptions
  await (await yd.transfer(await swap.getAddress(), ethers.parseUnits("1000000", 18))).wait();

  const Courses = await ethers.getContractFactory("Courses");
  const courses = await Courses.deploy(
    await yd.getAddress(),
    deployer.address,
    deployer.address,
    200 // 2% fee
  );
  await courses.waitForDeployment();

  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const outDir = path.join(__dirname, "..", "exports");
  mkdirSync(outDir, { recursive: true });

  const addresses = {
    chainId,
    YDToken: await yd.getAddress(),
    MockSwap: await swap.getAddress(),
    Courses: await courses.getAddress(),
  };

  writeFileSync(
    path.join(outDir, `${chainId}.json`),
    JSON.stringify({ addresses }, null, 2)
  );

  console.log("Deployed:", addresses);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
