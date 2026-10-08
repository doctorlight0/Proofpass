import { ethers } from "ethers";
import dotenv from "dotenv";
import ProofPassArtifact from "./abi/ProofPass.json" with { type: "json" };

dotenv.config();

const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL
);

const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ProofPassArtifact.abi,
  wallet
);

export async function issueCredential(credentialHash) {
  const tx = await contract.issueCredential(credentialHash);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
  };
}

export async function verifyCredential(credentialHash) {
  const result = await contract.verifyCredential(credentialHash);

  return {
    valid: result[0],
    issuer: result[1],
    issuedAt: Number(result[2]),
  };
}

export async function revokeCredential(credentialHash) {
  const tx = await contract.revokeCredential(credentialHash);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
  };
}
