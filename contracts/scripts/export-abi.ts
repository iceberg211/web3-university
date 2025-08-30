import { artifacts } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

async function main() {
  const names = ["YDToken", "MockSwap", "Courses"];
  const outDir = path.join(__dirname, "..", "exports");
  mkdirSync(outDir, { recursive: true });
  const abis: Record<string, any> = {};
  for (const n of names) {
    const art = await artifacts.readArtifact(n);
    abis[n] = art.abi;
  }
  writeFileSync(path.join(outDir, `abis.json`), JSON.stringify(abis, null, 2));
  console.log("Exported ABIs to exports/abis.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

