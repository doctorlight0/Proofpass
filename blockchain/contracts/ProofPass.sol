// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofPass {
    struct Credential {
        address issuer;
        uint256 issuedAt;
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Credential) private credentials;

    event CredentialIssued(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 issuedAt
    );

    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed issuer
    );

    function issueCredential(bytes32 credentialHash) external {
        require(credentialHash != bytes32(0), "Invalid credential hash");
        require(!credentials[credentialHash].exists, "Credential already exists");

        credentials[credentialHash] = Credential({
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            exists: true
        });

        emit CredentialIssued(
            credentialHash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyCredential(
        bytes32 credentialHash
    )
        external
        view
        returns (
            bool valid,
            address issuer,
            uint256 issuedAt
        )
    {
        Credential memory credential = credentials[credentialHash];

        if (!credential.exists || credential.revoked) {
            return (false, address(0), 0);
        }

        return (
            true,
            credential.issuer,
            credential.issuedAt
        );
    }

    function revokeCredential(bytes32 credentialHash) external {
        require(credentials[credentialHash].exists, "Credential does not exist");
        require(
            credentials[credentialHash].issuer == msg.sender,
            "Only issuer can revoke"
        );
        require(
            !credentials[credentialHash].revoked,
            "Credential already revoked"
        );

        credentials[credentialHash].revoked = true;

        emit CredentialRevoked(
            credentialHash,
            msg.sender
        );
    }
}