#![no_std]

use soroban_sdk::{
    contract,
    contractevent,
    contractimpl,
    contracttype,
    Address,
    BytesN,
    Env,
};

#[contracttype]
#[derive(Clone)]
pub struct Credential {
    pub issuer: Address,
    pub issued_at: u64,
    pub revoked: bool,
}

#[contracttype]
pub enum DataKey {
    Credential(BytesN<32>),
}

#[contractevent]
pub struct CredentialIssued {
    #[topic]
    pub issuer: Address,
    pub credential_hash: BytesN<32>,
}

#[contractevent]
pub struct CredentialRevoked {
    #[topic]
    pub issuer: Address,
    pub credential_hash: BytesN<32>,
}

#[contract]
pub struct ProofPass;

#[contractimpl]
impl ProofPass {
    pub fn issue_credential(
        env: Env,
        issuer: Address,
        credential_hash: BytesN<32>,
    ) {
        issuer.require_auth();

        if credential_hash == BytesN::from_array(&env, &[0u8; 32]) {
            panic!("Invalid credential hash");
        }

        let key = DataKey::Credential(credential_hash.clone());

        if env.storage().persistent().has(&key) {
            panic!("Credential already exists");
        }

        let credential = Credential {
            issuer: issuer.clone(),
            issued_at: env.ledger().timestamp(),
            revoked: false,
        };

        env.storage().persistent().set(&key, &credential);

        CredentialIssued {
            issuer,
            credential_hash,
        }
        .publish(&env);
    }

    pub fn verify_credential(
        env: Env,
        credential_hash: BytesN<32>,
    ) -> Option<Credential> {
        let key = DataKey::Credential(credential_hash);

        env.storage().persistent().get(&key)
    }

    pub fn revoke_credential(
        env: Env,
        issuer: Address,
        credential_hash: BytesN<32>,
    ) {
        let key = DataKey::Credential(credential_hash.clone());

        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Credential does not exist"));

        if credential.issuer != issuer {
            panic!("Only issuer can revoke");
        }

        issuer.require_auth();

        if credential.revoked {
            panic!("Credential already revoked");
        }

        credential.revoked = true;

        env.storage().persistent().set(&key, &credential);

        CredentialRevoked {
            issuer,
            credential_hash,
        }
        .publish(&env);
    }
}

#[cfg(test)]
mod test;