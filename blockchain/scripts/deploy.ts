import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create();

  const proofPass = await ethers.deployContract("ProofPass");

  await proofPass.waitForDeployment();

  console.log("ProofPass deployed to:", await proofPass.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
