# zkIA (new name idea needed)

Building a system on Hyle using zkAI (zk Advanced Identity) and RiscZero to enable secure payments by sending funds to an email, allowing recipients to verify their identity and later transition to any other sort of identity management, like password, passkey or Metamask account for fund management.

## Step-by-step process

1. **User Authentication** \
1.1 The sender authenticates using a supported identity method (e.g., password, passkey, email, or any zkAI-supported identity). \
1.2 zkAI runs the identity prover using RiscZero for secure verification.

2. **Sending Funds** \
2.1 The sender transfers funds to any email address. \
2.2 zkAI runs the prover on the server side (for optimization) to ensure transaction integrity. \

3. **Recipient Registers to Claim Funds***
3.1 The recipient (who has no prior Hyle account) registers using their email. \
3.2 A JWT (JSON Web Token) is recorded on-chain as an initial identity. \
3.3 zkAI runs the prover (server-side) to verify the registration and enable fund access. \

4. **Recipient Creates a Permanent Identity** \
4.1 The recipient registers a new identity, such as a username and password. \
4.2 They can now access and manage the funds tied to their email using their password, eliminating the need for JWT-based authentication.

## How it works

### Understanding the components of the demo

The zkAI demo consists of three components: the app, the proof generator, and the Hylé node.

The **app** helps the user craft a transaction through one interaction:

- Identification with identity provider for a proof of ID. This could be OpenID for email identity, or a simple password input field for password identity. 

The app sends this input to the proof generator. The proof generator executes the program and generates a proof.

The proof generators generate two proofs:

**Proof of ID**: verification of the Identity
**Proof of one of those:**
- Token (ERC-20) transfer
- Register new Identity
  
The app sends the two proofs through one single transaction to the Hylé node.

**The Hylé node:**

Unpacks the two proofs.
Verifies each proof with the correct verifier.
Ensures consistency by checking the public data contained in the proofs to ensure they all relate to the same transaction.

![Capture d’écran 2025-03-09 à 11 51 00](https://github.com/user-attachments/assets/470c7729-7850-4fb3-a01f-22f25bf5dbb7)
![Capture d’écran 2025-03-09 à 11 50 53](https://github.com/user-attachments/assets/8970c9fd-2248-474e-ad2c-c4c858b83a22)

## Quickstart

1. Run the Hyle local node on `localhost:4321`.

2. Run the Keycloak backend on `localhost:5000`: `./keycloak/run_dev.sh`.

3. Create a Keycloak realm and seed it with a test user: `python ./keycloak/seed_dev.py`. This will generate the JWT public key that will be hardcoded in the Hyle contract.

4. Run the prover rest API on `localhost:4000`: `python ./prover/prover.py` (run `pip install -r ./prover/requirements.txt`). Additionally, this will automatically register the Hyle contract on the local node.

5. Run the frontend on `localhost:3000`: `cd frontend && pnpm run dev`. (run `pnpm install` first if not already done).

## References

- [simple-identity example contract](https://github.com/Hyle-org/examples/blob/main/simple-identity)
- [reference oidc contract](https://github.com/Hyle-org/hackathons/tree/main/oidc-identity)
