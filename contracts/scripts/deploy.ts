import { ethers } from "hardhat";

// Minimal deploy script: only deploy contracts, no extra logic.
// Current focus: issue the ERC20 token (hewei/hw).
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const YD = await ethers.getContractFactory("YDToken");
  const yd = await YD.deploy(deployer.address);
  await yd.waitForDeployment();

  console.log("YDToken (hewei/hw) deployed at:", await yd.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
