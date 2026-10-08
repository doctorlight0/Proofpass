import React from "react";
import ReactQrCode from "react-qr-code";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import "./App.css";

const API_URL = "https://trust-pass.onrender.com";

/* =========================
   HOME
========================= */

function Home() {
  return (
    <main className="hero">
      <div className="hero-orb hero-orb-one"></div>
      <div className="hero-orb hero-orb-two"></div>

      <div className="hero-content animate-up">
        <div className="badge">
          <span className="badge-dot"></span>
          Blockchain-verified credentials
        </div>

        <h1>
          Credentials you can
          <span> actually trust.</span>
        </h1>

        <p>
          ProofPass makes certificates verifiable using blockchain
          technology. Issue a credential, share its QR code, and verify
          it instantly.
        </p>

        <div className="hero-buttons">
          <Link to="/issue" className="button primary">
            Issue Credential
            <span>→</span>
          </Link>

          <Link to="/verify" className="button secondary">
            Verify Credential
          </Link>
        </div>

        <div className="hero-trust">
          <div>
            <span className="trust-dot"></span>
            Secured on Ethereum
          </div>

          <div>
            <span className="trust-dot"></span>
            Tamper-resistant
          </div>
        </div>
      </div>

      <div className="hero-card animate-card">
        <div className="card-glow"></div>

        <div className="credential-preview">
          <div className="preview-top">
            <span className="preview-brand">
              PROOF<span>PASS</span>
            </span>

            <span className="verified-small">
              <span>✓</span> VERIFIED
            </span>
          </div>

          <div className="preview-line"></div>

          <p className="preview-label">
            CERTIFICATE OF ACHIEVEMENT
          </p>

          <h2>Web Development</h2>

          <p className="preview-holder">
            Awarded to <strong>Ahmed Ibrahim</strong>
          </p>

          <div className="preview-hash">
            <span>BLOCKCHAIN PROOF</span>
            <code>0xa0651c33...6186b03</code>
          </div>

          <div className="preview-bottom">
            <div>
              <span>ISSUED BY</span>
              <strong>ProofPass Academy</strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong className="green">Verified</strong>
            </div>
          </div>

          <div className="preview-corner"></div>
        </div>
      </div>
    </main>
  );
}

/* =========================
   ISSUE PAGE
========================= */

function IssueCredential() {
  return (
    <main className="page">
      <div className="page-header animate-up">
        <div className="badge">ISSUER</div>

        <h1>Issue a credential</h1>

        <p>
          Create a verifiable credential and anchor its proof on
          Ethereum Sepolia.
        </p>
      </div>

      <IssueForm />
    </main>
  );
}

function IssueForm() {
  const [holderName, setHolderName] = React.useState("");
  const [credentialName, setCredentialName] = React.useState("");
  const [issuerName, setIssuerName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/api/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holderName,
          credentialName,
          issuerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to issue credential"
        );
      }

      setResult(data.credential);

      setHolderName("");
      setCredentialName("");
      setIssuerName("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyBlockchainProof() {
    if (!result?.credential_hash) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        result.credential_hash
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Failed to copy blockchain proof");
    }
  }

  return (
    <div className="form-container">
      <form
        className="credential-form glass-card animate-up"
        onSubmit={handleSubmit}
      >
        <div className="form-top">
          <div>
            <span className="form-eyebrow">
              NEW CREDENTIAL
            </span>

            <h2>Credential details</h2>
          </div>

          <div className="secure-mark">⌁</div>
        </div>

        <div className="input-group">
          <label>Holder name</label>

          <input
            type="text"
            placeholder="e.g. Ahmed Ibrahim"
            value={holderName}
            onChange={(event) =>
              setHolderName(event.target.value)
            }
            required
          />
        </div>

        <div className="input-group">
          <label>Credential</label>

          <input
            type="text"
            placeholder="e.g. Web Development"
            value={credentialName}
            onChange={(event) =>
              setCredentialName(event.target.value)
            }
            required
          />
        </div>

        <div className="input-group">
          <label>Issuer</label>

          <input
            type="text"
            placeholder="e.g. ProofPass Academy"
            value={issuerName}
            onChange={(event) =>
              setIssuerName(event.target.value)
            }
            required
          />
        </div>

        <div className="form-note">
          <span>✓</span>
          Credential proof will be recorded on Ethereum Sepolia.
        </div>

        <button
          type="submit"
          className="button primary submit-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner"></span>
              Issuing on blockchain...
            </>
          ) : (
            <>
              Issue Credential
              <span>→</span>
            </>
          )}
        </button>

        {error && (
          <div className="error-box">
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>
        )}
      </form>

      {result && (
        <div className="success-box animate-success">
          <div className="success-icon">✓</div>

          <div className="success-content">
            <span className="success-eyebrow">
              TRANSACTION CONFIRMED
            </span>

            <h2>Credential issued</h2>

            <p>
              Your credential has been stored and its proof has
              been recorded on Ethereum Sepolia.
            </p>

            <div className="issued-proof">
              <span>BLOCKCHAIN PROOF</span>

              <code>{result.credential_hash}</code>

              <div className="transaction-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={copyBlockchainProof}
                >
                  {copied ? "✓ Copied" : "Copy Proof"}
                </button>

                <a
                  href={`https://sepolia.etherscan.io/tx/${result.transaction_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-button"
                >
                  View Transaction ↗
                </a>
              </div>
            </div>

            <Link
              to={`/credential/${result.credential_hash}`}
              className="button primary"
            >
              View Credential →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   CREDENTIAL PAGE
========================= */

function CredentialPage() {
  const { hash } = useParams();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [revoking, setRevoking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [revokeSuccess, setRevokeSuccess] =
    React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function fetchCredential() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/credentials/${hash}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Credential not found"
        );
      }

      setData(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchCredential();
  }, [hash]);

  async function handleRevoke() {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this credential?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRevoking(true);
      setError("");
      setRevokeSuccess(false);

      const response = await fetch(
        `${API_URL}/api/credentials/${hash}/revoke`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to revoke credential"
        );
      }

      setRevokeSuccess(true);

      await fetchCredential();
    } catch (error) {
      setError(error.message);
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return (
      <main className="page centered">
        <div className="loader"></div>
        <p>Loading credential...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="page centered">
        <div className="error-box">
          {error}
        </div>
      </main>
    );
  }

  const credential = data.credential;
  const blockchain = data.blockchain;

  const verified =
    blockchain.valid && !credential.revoked;

  /*
    IMPORTANT:
    The QR code contains the credential proof,
    not the transaction hash.
  */
  const verificationUrl =
    `${window.location.origin}/verify/${credential.credential_hash}`;

  async function copyBlockchainProof() {
    if (!credential?.credential_hash) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        credential.credential_hash
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Failed to copy blockchain proof");
    }
  }

  return (
    <main className="page">
      <div className="credential-page animate-up">

        <div className="credential-card">

          <div className="credential-header">
            <div>
              <span className="brand">
                PROOF<span>PASS</span>
              </span>

              <p>CERTIFICATE OF ACHIEVEMENT</p>
            </div>

            <div
              className={
                verified
                  ? "status verified"
                  : "status revoked"
              }
            >
              {verified
                ? "✓ VERIFIED"
                : "✕ REVOKED"}
            </div>
          </div>

          <div className="credential-body">

            <div className="credential-accent"></div>

            <p className="small-label">
              THIS CREDENTIAL CERTIFIES THAT
            </p>

            <h1>{credential.holder_name}</h1>

            <p className="small-label">
              HAS SUCCESSFULLY EARNED
            </p>

            <h2>{credential.credential_name}</h2>

            <div className="credential-info">

              <div>
                <span>ISSUED BY</span>
                <strong>
                  {credential.issuer_name}
                </strong>
              </div>

              <div>
                <span>ISSUED</span>
                <strong>
                  {new Date(
                    credential.created_at
                  ).toLocaleDateString()}
                </strong>
              </div>

            </div>

          </div>

          <div className="credential-footer">

            <div className="credential-proof">
              <span>BLOCKCHAIN PROOF</span>

              <code>
                {credential.credential_hash}
              </code>

              <button
                type="button"
                className="secondary-button"
                onClick={copyBlockchainProof}
              >
                {copied ? "✓ Copied" : "Copy Proof"}
              </button>
            </div>

            <div className="qr-wrapper">

              <div className="qr-box">
                <ReactQrCode
                  value={verificationUrl}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <span>SCAN TO VERIFY</span>

            </div>

          </div>

        </div>

        <div className="transaction-box">

          <div className="transaction-info">
            <span>BLOCKCHAIN TRANSACTION</span>

            <strong>Ethereum Sepolia</strong>

            <code>
              {credential.transaction_hash}
            </code>
          </div>

          <div className="transaction-actions">

            <a
              href={`https://sepolia.etherscan.io/tx/${credential.transaction_hash}`}
              target="_blank"
              rel="noreferrer"
              className="secondary-button"
            >
              View on Etherscan ↗
            </a>

          </div>

        </div>

        {!credential.revoked && (
          <div className="revoke-section">

            <button
              className="danger-button"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking
                ? "Revoking on blockchain..."
                : "Revoke Credential"}
            </button>

            <p>
              Revoking a credential permanently marks it as
              invalid on the blockchain.
            </p>

          </div>
        )}

        {credential.revoked && (
          <div className="revoked-message">

            <div className="revoked-icon">
              ✕
            </div>

            <div>
              <strong>
                This credential has been revoked.
              </strong>

              <p>
                Blockchain verification confirms that this
                credential is no longer valid.
              </p>
            </div>

          </div>
        )}

        {revokeSuccess && (
          <div className="success-box animate-success">
            Credential successfully revoked on
            Ethereum Sepolia.
          </div>
        )}

        {error && data && (
          <div className="error-box">
            {error}
          </div>
        )}

      </div>
    </main>
  );
}

/* =========================
   VERIFY PAGE
========================= */

function VerifyPage() {
  const [hash, setHash] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function verify() {
    if (!hash.trim()) {
      setError("Please enter a blockchain proof");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_URL}/api/credentials/${hash.trim()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Credential not found"
        );
      }

      setResult(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">

      <div className="page-header animate-up">

        <div className="badge">
          VERIFIER
        </div>

        <h1>
          Verify a credential
        </h1>

        <p>
          Enter a blockchain proof or scan a ProofPass QR
          code to verify its authenticity.
        </p>

      </div>

      <div className="verify-container">

        <div className="verify-search glass-card">

          <input
            type="text"
            placeholder="Paste blockchain proof · 0x..."
            value={hash}
            onChange={(event) =>
              setHash(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                verify();
              }
            }}
          />

          <button
            className="button primary"
            onClick={verify}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Verifying...
              </>
            ) : (
              "Verify →"
            )}
          </button>

        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {result && (
          <VerificationResult data={result} />
        )}

      </div>
    </main>
  );
}

/* =========================
   VERIFY BY HASH / QR
========================= */

function VerifyByHash({ hash }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function verifyCredential() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/credentials/${hash}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Credential not found"
          );
        }

        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    verifyCredential();
  }, [hash]);

  return (
    <main className="page centered">

      {loading && (
        <>
          <div className="loader"></div>
          <p>Verifying credential...</p>
        </>
      )}

      {error && (
        <div className="error-box">
          <strong>Verification failed</strong>
          <span>{error}</span>
        </div>
      )}

      {data && (
        <VerificationResult data={data} />
      )}

    </main>
  );
}

/* =========================
   VERIFICATION RESULT
========================= */

function VerificationResult({ data }) {
  const credential = data.credential;
  const blockchain = data.blockchain;

  const verified =
    blockchain.valid && !credential.revoked;

  const [copied, setCopied] = React.useState(false);

  async function copyBlockchainProof() {
    try {
      await navigator.clipboard.writeText(
        credential.credential_hash
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      console.error("Failed to copy blockchain proof");
    }
  }

  return (
    <div
      className={
        verified
          ? "verification-result verified-result animate-success"
          : "verification-result revoked-result animate-success"
      }
    >

      <div
        className={
          verified
            ? "verification-icon verified-icon"
            : "verification-icon revoked-icon"
        }
      >
        {verified ? "✓" : "✕"}
      </div>

      <div className="verification-status-label">
        {verified
          ? "BLOCKCHAIN CONFIRMED"
          : "CREDENTIAL INVALID"}
      </div>

      <h2>
        {verified
          ? "Credential Verified"
          : "Credential Revoked"}
      </h2>

      <p>
        {verified
          ? "This credential matches the proof recorded on the Ethereum blockchain."
          : "This credential is no longer valid."}
      </p>

      <div className="verification-details">

        <div>
          <span>Holder</span>
          <strong>{credential.holder_name}</strong>
        </div>

        <div>
          <span>Credential</span>
          <strong>{credential.credential_name}</strong>
        </div>

        <div>
          <span>Issuer</span>
          <strong>{credential.issuer_name}</strong>
        </div>

        <div>
          <span>Blockchain issuer</span>
          <strong className="address">
            {blockchain.issuer}
          </strong>
        </div>

        <div>
          <span>Issued</span>
          <strong>
            {new Date(
              credential.created_at
            ).toLocaleDateString()}
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong
            className={
              verified
                ? "green"
                : "revoked-text"
            }
          >
            {verified
              ? "Verified"
              : "Revoked"}
          </strong>
        </div>

      </div>

      <div className="verification-proof">

        <span>BLOCKCHAIN PROOF</span>

        <code>
          {credential.credential_hash}
        </code>

        <div className="transaction-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={copyBlockchainProof}
          >
            {copied ? "✓ Copied" : "Copy Proof"}
          </button>

          <a
            href={`https://sepolia.etherscan.io/tx/${credential.transaction_hash}`}
            target="_blank"
            rel="noreferrer"
            className="secondary-button"
          >
            View Transaction ↗
          </a>

        </div>

      </div>

    </div>
  );
}

/* =========================
   VERIFY ROUTE
========================= */

function VerifyRoute() {
  const { hash } = useParams();

  return <VerifyByHash hash={hash} />;
}

/* =========================
   APP
========================= */

function App() {
  return (
    <BrowserRouter>

      <nav className="navbar">

        <Link
          to="/"
          className="logo"
        >
          Proof<span>Pass</span>
        </Link>

        <div className="nav-links">

          <Link to="/issue">
            Issue
          </Link>

          <Link to="/verify">
            Verify
          </Link>

        </div>

      </nav>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/issue"
          element={<IssueCredential />}
        />

        <Route
          path="/credential/:hash"
          element={<CredentialPage />}
        />

        <Route
          path="/verify"
          element={<VerifyPage />}
        />

        <Route
          path="/verify/:hash"
          element={<VerifyRoute />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;