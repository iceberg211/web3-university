import { artifacts, ethers } from "hardhat";
import { formatUnits, parseUnits } from "ethers";
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log("Network:", network.name || chainId);
  console.log("Deployer:", deployer.address);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", formatUnits(bal, 18), "ETH");

  // 1) Resolve existing USDT address from env
  const usdt = process.env.USDT_ADDRESS;
  if (!usdt) throw new Error("Please set USDT_ADDRESS env to your existing USDT token address");

  // 2) Deploy SimpleUSDTStaking
  const Staking = await ethers.getContractFactory("SimpleUSDTStaking");
  const staking = await Staking.deploy(usdt, deployer.address);
  console.log("Staking tx:", staking.deploymentTransaction()?.hash);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("Staking deployed at:", stakingAddr);

  // 3) Optional: Fund rewards if REWARD_AMOUNT is provided (in whole USDT, 6 decimals assumed)
  const rewardStr = process.env.REWARD_AMOUNT;
  if (rewardStr && Number(rewardStr) > 0) {
    const usdtAbi = [
      { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
    ];
    const rewardAmt = parseUnits(rewardStr, 6);
    const token = new ethers.Contract(usdt, usdtAbi, deployer as any);
    const approveTx = await token.approve(stakingAddr, rewardAmt);
    await approveTx.wait();
    const addTx = await staking.connect(deployer).addRewards(rewardAmt);
    await addTx.wait();
    console.log("Funded rewards:", formatUnits(rewardAmt, 6), "USDT");
  } else {
    console.log("Skip funding rewards (set REWARD_AMOUNT to fund)");
  }

  // 4) Merge addresses to exports/<chainId>.json
  const outDir = path.join(__dirname, "..", "exports");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${chainId}.json`);
  let payload: any = { addresses: { chainId } };
  if (existsSync(outFile)) {
    try { payload = JSON.parse(readFileSync(outFile, "utf8")); } catch {}
    payload.addresses = payload.addresses || { chainId };
  }
  payload.addresses.SimpleUSDTStaking = stakingAddr;
  writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Updated exports/${chainId}.json`);

  // 5) Merge ABIs to exports/abis.json
  const abisFile = path.join(outDir, `abis.json`);
  let abis: Record<string, any> = {};
  if (existsSync(abisFile)) {
    try { abis = JSON.parse(readFileSync(abisFile, "utf8")); } catch {}
  }
  for (const n of ["SimpleUSDTStaking"]) {
    const art = await artifacts.readArtifact(n);
    abis[n] = art.abi;
  }
  writeFileSync(abisFile, JSON.stringify(abis, null, 2));
  console.log("Merged ABIs to exports/abis.json");

  // 6) Sync to web/contracts
  const webContractsDir = path.join(__dirname, "..", "..", "web", "contracts");
  mkdirSync(webContractsDir, { recursive: true });
  copyFileSync(abisFile, path.join(webContractsDir, "abis.json"));
  copyFileSync(outFile, path.join(webContractsDir, `${chainId}.json`));
  copyFileSync(outFile, path.join(webContractsDir, `addresses.json`));
  console.log("Synced staking artifacts to web/contracts/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
