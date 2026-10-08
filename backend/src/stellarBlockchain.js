import {
  Address,
  Contract,
  Keypair,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
} from "@stellar/stellar-sdk";

import dotenv from "dotenv";

dotenv.config();

const server = new rpc.Server(
  process.env.STELLAR_RPC_URL
);

const keypair = Keypair.fromSecret(
  process.env.STELLAR_SECRET_KEY
);

const contract = new Contract(
  process.env.STELLAR_CONTRACT_ADDRESS
);

const networkPassphrase =
  process.env.STELLAR_NETWORK_PASSPHRASE;

function hashToScVal(credentialHash) {
  return xdr.ScVal.scvBytes(
    Buffer.from(
      credentialHash.replace(/^0x/, ""),
      "hex"
    )
  );
}

function issuerToScVal() {
  return new Address(
    keypair.publicKey()
  ).toScVal();
}

function decodeScValMap(result) {
  const entries = result.map;

  const decoded = {};

  for (const entry of entries) {
    const keyJson = entry.key.toJSON();
    const value = entry.val;

    const keyName =
      keyJson.sym ??
      keyJson.symbol ??
      String(keyJson);

    decoded[keyName] = value;
  }

  return decoded;
}

async function submitContractTransaction(
  transaction
) {
  const simulated =
    await server.simulateTransaction(
      transaction
    );

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }

  const assembled =
    rpc
      .assembleTransaction(
        transaction,
        simulated
      )
      .build();

  assembled.sign(keypair);

  const response =
    await server.sendTransaction(
      assembled
    );

  if (response.status === "ERROR") {
    throw new Error(
      response.errorResult?.toString() ||
        "Stellar transaction failed"
    );
  }

  for (let attempt = 0; attempt < 30; attempt++) {
    const result =
      await server.getTransaction(
        response.hash
      );

    if (result.status === "SUCCESS") {
      return {
        transactionHash: response.hash,
      };
    }

    if (result.status === "FAILED") {
      throw new Error(
        "Stellar transaction failed"
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );
  }

  throw new Error(
    "Timed out waiting for Stellar transaction confirmation"
  );
}

export async function issueCredential(
  credentialHash
) {
  const account =
    await server.getAccount(
      keypair.publicKey()
    );

  const transaction =
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          "issue_credential",
          issuerToScVal(),
          hashToScVal(credentialHash)
        )
      )
      .setTimeout(300)
      .build();

  return submitContractTransaction(
    transaction
  );
}

export async function verifyCredential(
  credentialHash
) {
  const account =
    await server.getAccount(
      keypair.publicKey()
    );

  const transaction =
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          "verify_credential",
          hashToScVal(credentialHash)
        )
      )
      .setTimeout(300)
      .build();

  const simulated =
    await server.simulateTransaction(
      transaction
    );

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }

  const result =
    simulated.result?.retval;

  if (!result) {
    return null;
  }

  const credential =
    decodeScValMap(result);

  const issuedAtJson =
    credential.issued_at.toJSON();

  const issuerJson =
    credential.issuer.toJSON();

  const revokedJson =
    credential.revoked.toJSON();

  const issuedAt =
    Number(
      issuedAtJson.u64 ??
        issuedAtJson.value
    );

  const issuer =
    issuerJson.address ??
    issuerJson.account ??
    issuerJson.ed25519;

  const revoked =
    revokedJson.bool ??
    revokedJson.b ??
    revokedJson.value;

  return {
    valid: !revoked,
    issuer: String(issuer),
    issuedAt,
    revoked,
  };
}

export async function revokeCredential(
  credentialHash
) {
  const account =
    await server.getAccount(
      keypair.publicKey()
    );

  const transaction =
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          "revoke_credential",
          issuerToScVal(),
          hashToScVal(credentialHash)
        )
      )
      .setTimeout(300)
      .build();

  return submitContractTransaction(
    transaction
  );
}