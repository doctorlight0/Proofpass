import { expect } from "chai";
import hre from "hardhat";

describe("ProofPass", function () {
  async function deployProofPass() {
    const { ethers } = await hre.network.create();

    const [issuer, anotherUser] = await ethers.getSigners();

    const proofPass = await ethers.deployContract("ProofPass");

    return {
      ethers,
      proofPass,
      issuer,
      anotherUser,
    };
  }

  it("should issue and verify a credential", async function () {
    const { ethers, proofPass, issuer } = await deployProofPass();

    const credentialHash = ethers.id(
      "Ahmed Ibrahim - Web Development"
    );

    await proofPass.issueCredential(credentialHash);

    const result = await proofPass.verifyCredential(credentialHash);

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(issuer.address);
  });

  it("should revoke a credential", async function () {
    const { ethers, proofPass } = await deployProofPass();

    const credentialHash = ethers.id(
      "Ahmed Ibrahim - Web Development"
    );

    await proofPass.issueCredential(credentialHash);

    await proofPass.revokeCredential(credentialHash);

    const result = await proofPass.verifyCredential(credentialHash);

    expect(result[0]).to.equal(false);
  });

  it("should prevent another wallet from revoking a credential", async function () {
    const { ethers, proofPass, anotherUser } = await deployProofPass();

    const credentialHash = ethers.id(
      "Ahmed Ibrahim - Web Development"
    );

    await proofPass.issueCredential(credentialHash);

    await expect(
      proofPass
        .connect(anotherUser)
        .revokeCredential(credentialHash)
    ).to.be.revertedWith("Only issuer can revoke");
  });
});