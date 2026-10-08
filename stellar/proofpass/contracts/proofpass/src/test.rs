#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address,
    BytesN,
    Env,
};

fn setup() -> (Env, ProofPassClient<'static>, Address, Address) {
    let env = Env::default();

    env.mock_all_auths();

    let contract_id = env.register(ProofPass, ());
    let client = ProofPassClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let another_user = Address::generate(&env);

    (env, client, issuer, another_user)
}

fn credential_hash(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[1u8; 32])
}

#[test]
fn test_issue_and_verify_credential() {
    let (env, client, issuer, _) = setup();

    let hash = credential_hash(&env);

    client.issue_credential(&issuer, &hash);

    let credential = client
        .verify_credential(&hash)
        .expect("credential should exist");

    assert_eq!(credential.issuer, issuer);
    assert!(!credential.revoked);
}

#[test]
fn test_revoke_credential() {
    let (env, client, issuer, _) = setup();

    let hash = credential_hash(&env);

    client.issue_credential(&issuer, &hash);
    client.revoke_credential(&issuer, &hash);

    let credential = client
        .verify_credential(&hash)
        .expect("credential should still exist");

    assert!(credential.revoked);
}

#[test]
fn test_missing_credential() {
    let (env, client, _, _) = setup();

    let hash = credential_hash(&env);

    let credential = client.verify_credential(&hash);

    assert!(credential.is_none());
}

#[test]
#[should_panic(expected = "Credential already exists")]
fn test_duplicate_credential_rejected() {
    let (env, client, issuer, _) = setup();

    let hash = credential_hash(&env);

    client.issue_credential(&issuer, &hash);
    client.issue_credential(&issuer, &hash);
}

#[test]
#[should_panic(expected = "Only issuer can revoke")]
fn test_non_issuer_cannot_revoke() {
    let (env, client, issuer, another_user) = setup();

    let hash = credential_hash(&env);

    client.issue_credential(&issuer, &hash);
    client.revoke_credential(&another_user, &hash);
}

#[test]
#[should_panic(expected = "Invalid credential hash")]
fn test_zero_hash_rejected() {
    let (env, client, issuer, _) = setup();

    let zero_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.issue_credential(&issuer, &zero_hash);
}