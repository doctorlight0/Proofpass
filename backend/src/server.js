import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";

import {
  issueCredential,
  verifyCredential,
  revokeCredential,
} from "./blockchain.js";

import {
  issueCredential as issueStellarCredential,
  verifyCredential as verifyStellarCredential,
  revokeCredential as revokeStellarCredential,
} from "./stellarBlockchain.js";

import { pool } from "./db/db.js";

dotenv.config();

const app = express();


// ================================
// Middleware
// ================================

app.use(cors());
app.use(express.json());


// ================================
// Health Check
// ================================

app.get("/", (req, res) => {
  res.json({
    message: "ProofPass API is running",
  });
});


// ================================
// Issue Credential
// ================================

app.post("/api/credentials", async (req, res) => {
  try {
    const {
      holderName,
      credentialName,
      issuerName,
      network = "ethereum",
    } = req.body;

    // Validate request
    if (
      !holderName ||
      !credentialName ||
      !issuerName ||
      !["ethereum", "stellar"].includes(network)
    ) {
      return res.status(400).json({
        message:
          "holderName, credentialName, issuerName and a valid network are required",
      });
    }

    // Credential information
    const credential = {
      holderName,
      credentialName,
      issuerName,
    };

    // Convert credential data into a string
    const credentialData = JSON.stringify(credential);

    // Generate credential hash
    const credentialHash = ethers.id(credentialData);

    // =================================
    // Check for duplicate credential
    // =================================

    const existingCredential = await pool.query(
      `
      SELECT *
      FROM credentials
      WHERE credential_hash = $1
      AND network = $2
      `,
      [credentialHash, network]
    );

    if (existingCredential.rows.length > 0) {
      return res.status(409).json({
        message:
          "This credential has already been issued on this network.",
        credential: existingCredential.rows[0],
      });
    }

    // =================================
    // Issue on selected blockchain
    // =================================

    let blockchainResult;

    if (network === "stellar") {
      blockchainResult =
        await issueStellarCredential(credentialHash);
    } else {
      blockchainResult =
        await issueCredential(credentialHash);
    }

    // =================================
    // Store credential in PostgreSQL
    // =================================

    const databaseResult = await pool.query(
      `
      INSERT INTO credentials
      (
        holder_name,
        credential_name,
        issuer_name,
        credential_hash,
        transaction_hash,
        network
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        holderName,
        credentialName,
        issuerName,
        credentialHash,
        blockchainResult.transactionHash,
        network,
      ]
    );

    // =================================
    // Success response
    // =================================

    res.status(201).json({
      message: "Credential issued successfully",
      credential: databaseResult.rows[0],
    });

  } catch (error) {
    console.error("Issue credential error:", error);

    res.status(500).json({
      message: "Failed to issue credential",
      error: error.message,
    });
  }
});


// ================================
// Verify Credential
// ================================

app.get("/api/credentials/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // =================================
    // Search by credential hash first
    // =================================

    let databaseResult = await pool.query(
      `
      SELECT *
      FROM credentials
      WHERE credential_hash = $1
      `,
      [identifier]
    );

    // =================================
    // If not found, search transaction hash
    // =================================

    if (databaseResult.rows.length === 0) {
      databaseResult = await pool.query(
        `
        SELECT *
        FROM credentials
        WHERE transaction_hash = $1
        `,
        [identifier]
      );
    }

    // =================================
    // Credential does not exist
    // =================================

    if (databaseResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Credential not found. Please check the hash and try again.",
      });
    }

    const credential = databaseResult.rows[0];

    // =================================
    // Verify on selected blockchain
    // =================================

    let blockchainResult;

    if (credential.network === "stellar") {
      blockchainResult =
        await verifyStellarCredential(
          credential.credential_hash
        );
    } else {
      blockchainResult =
        await verifyCredential(
          credential.credential_hash
        );
    }

    // =================================
    // Return database + blockchain data
    // =================================

    res.json({
      credential,
      blockchain: blockchainResult,
    });

  } catch (error) {
    console.error("Verify credential error:", error);

    res.status(500).json({
      message: "Failed to verify credential",
      error: error.message,
    });
  }
});


// ================================
// Revoke Credential
// ================================

app.post("/api/credentials/:hash/revoke", async (req, res) => {
  try {
    const { hash } = req.params;

    // =================================
    // Find credential
    // =================================

    const existingCredential = await pool.query(
      `
      SELECT *
      FROM credentials
      WHERE credential_hash = $1
      `,
      [hash]
    );

    if (existingCredential.rows.length === 0) {
      return res.status(404).json({
        message: "Credential not found",
      });
    }

    const credential = existingCredential.rows[0];

    // =================================
    // Revoke on selected blockchain
    // =================================

    let blockchainResult;

    if (credential.network === "stellar") {
      blockchainResult =
        await revokeStellarCredential(hash);
    } else {
      blockchainResult =
        await revokeCredential(hash);
    }

    // =================================
    // Update PostgreSQL
    // =================================

    const databaseResult = await pool.query(
      `
      UPDATE credentials
      SET revoked = TRUE
      WHERE credential_hash = $1
      RETURNING *
      `,
      [hash]
    );

    // =================================
    // Success response
    // =================================

    res.json({
      message: "Credential revoked successfully",
      credential: databaseResult.rows[0],
      transactionHash:
        blockchainResult.transactionHash,
    });

  } catch (error) {
    console.error("Revoke credential error:", error);

    res.status(500).json({
      message: "Failed to revoke credential",
      error: error.message,
    });
  }
});


// ================================
// Start Server
// ================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`ProofPass API running on port ${PORT}`);
});