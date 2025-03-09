use clap::{error, Error};
use clap::{Parser, Subcommand};
use client_sdk::helpers::risc0::Risc0Prover;
use contract_identity::IdentityContractState;
use contract_identity::IdentificationMethods;
use contract_identity::IdentityAction;
use contract_identity;
use contract_identity::jwt::JwkPublicKey;
use contract_identity::jwt::OpenIdContext;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use sdk::api::APIRegisterContract;
use sdk::BlobTransaction;
use sdk::ProofTransaction;
use sdk::{ContractInput, Digestable};
use openssl::rsa::Rsa;


// These constants represent the RISC-V ELF and the image ID generated by risc0-build.
// The ELF is used for proving and the ID is used for verification.
use methods_identity::{GUEST_ELF, GUEST_ID};

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    #[clap(long, short)]
    reproducible: bool,

    #[arg(long, default_value = "http://localhost:4321")]
    pub host: String,

    #[arg(long, default_value = "simple_identity")]
    pub contract_name: String,
}

#[derive(Subcommand)]
enum Commands {
    RegisterContract {
        jwt_public: String
    },
    RegisterIdentity {
        identity: String,
        password: String,
        method:String,
    },
    VerifyIdentity {
        identity: String,
        password: String,
        nonce: u32,
        method: String,
    },
}

fn extract_jwk_public_key(encoded_key: &str) -> Result<JwkPublicKey, Box<dyn std::error::Error>> {
    // Decode the base64 string
    let der_bytes = STANDARD.decode(encoded_key)?;
    
    // Parse the DER-encoded SubjectPublicKeyInfo
    let rsa = Rsa::public_key_from_der(&der_bytes)?;
    
    // Get the components as BigNum
    let n = rsa.n().to_owned()?;
    let e = rsa.e().to_owned()?;
    
    // Convert to base64url for JWK format
    let n_bytes = n.to_vec();
    let e_bytes = e.to_vec();
    
    let n_base64 = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&n_bytes);
    let e_base64 = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&e_bytes);
    
    Ok(JwkPublicKey {
        n: n_base64,
        e: e_base64,
    })
}

#[tokio::main]
async fn main() {
    // Initialize tracing. In order to view logs, run `RUST_LOG=info cargo run`
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    let cli = Cli::parse();

    let client = client_sdk::rest_client::NodeApiHttpClient::new(cli.host).unwrap();

    let contract_name = &cli.contract_name;

    let prover = Risc0Prover::new(GUEST_ELF);

    match cli.command {
        Commands::RegisterContract {jwt_public} => {
            let jwk = match extract_jwk_public_key(&jwt_public) {
                Ok(pk) => pk,
                _ => JwkPublicKey {e: "failed".to_string(), n:"to_parse_the jwk".to_string()}
            };

            // Build initial state of contract
            let initial_state = IdentityContractState::new(jwk);
            println!("Initial state: {:?}", initial_state);

            // Send the transaction to register the contract
            let res = client
                .register_contract(&APIRegisterContract {
                    verifier: "risc0".into(),
                    program_id: sdk::ProgramId(sdk::to_u8_array(&GUEST_ID).to_vec()),
                    state_digest: initial_state.as_digest(),
                    contract_name: contract_name.clone().into(),
                })
                .await
                .unwrap();

            println!("✅ Register contract tx sent. Tx hash: {}", res);
        }
        Commands::RegisterIdentity { identity, password, method} => {
            // Fetch the initial state from the node
            let initial_state: IdentityContractState = client
                .get_contract(&contract_name.clone().into())
                .await
                .unwrap()
                .state
                .into();

            println!("Initial state {:?}", initial_state.clone());
            println!("Identity {:?}", identity.clone());
            // ----
            // Build the blob transaction
            // ----
            let ia = match method.as_str() {
                "email" => IdentificationMethods::Email,
                "password" => IdentificationMethods::Password,
                _ => IdentificationMethods::Email,
            };

            let action = IdentityAction::RegisterIdentity { 
                identification_method: ia, 
                account: identity.clone(),
                context: OpenIdContext {issuer: "provider".to_string(), audience: "audience".to_string()}
            };

            let blobs = vec![sdk::Blob {
                contract_name: contract_name.clone().into(),
                data: sdk::BlobData(borsh::to_vec(&action).expect("failed to encode BlobData")),
            }];
            let blob_tx = BlobTransaction::new(identity.clone(), blobs.clone());

            // Send the blob transaction
            let blob_tx_hash = client.send_tx_blob(&blob_tx).await.unwrap();
            println!("✅ Blob tx sent. Tx hash: {}", blob_tx_hash);

            // ----
            // Prove the state transition
            // ----

            let identity = blob_tx.identity.clone();

            // Build the contract input
            let inputs = ContractInput {
                state: initial_state.as_bytes().unwrap(),
                identity,
                tx_hash: blob_tx_hash,
                private_input: password.into_bytes().to_vec(),
                tx_ctx: None,
                blobs: blobs.clone(),
                index: sdk::BlobIndex(0),
            };

            // Generate the zk proof
            let proof = prover.prove(inputs).await.unwrap();

            let proof_tx = ProofTransaction {
                proof,
                contract_name: contract_name.clone().into(),
            };

            // Send the proof transaction
            let proof_tx_hash = client.send_tx_proof(&proof_tx).await.unwrap();
            println!("✅ Proof tx sent. Tx hash: {}", proof_tx_hash);
        }
        Commands::VerifyIdentity {
            identity,
            password,
            nonce,
            method
        } => {
            
                let ia = match method.as_str() {
                    "email" => IdentificationMethods::Email,
                    "password" => IdentificationMethods::Password,
                    _ => IdentificationMethods::Email,
                };


                // Fetch the initial state from the node
                let initial_state: IdentityContractState = client
                    .get_contract(&contract_name.clone().into())
                    .await
                    .unwrap()
                    .state
                    .into();
                // ----
                // Build the blob transaction
                // ----

                let action = IdentityAction::VerifyIdentity {
                    identification_method: ia,
                    account: identity.clone(),
                    nonce: 0,
                    context: OpenIdContext {issuer: "provider".to_string(), audience: "audience".to_string()}
                };

                let blobs = vec![sdk::Blob {
                    contract_name: contract_name.clone().into(),
                    data: sdk::BlobData(borsh::to_vec(&action).expect("failed to encode BlobData")),
                }];
                let blob_tx = BlobTransaction::new(identity, blobs.clone());

                // Send the blob transaction
                let blob_tx_hash = client.send_tx_blob(&blob_tx).await.unwrap();
                println!("✅ Blob tx sent. Tx hash: {}", blob_tx_hash);

                // ----
                // Prove the state transition
                // ----

                // Build the contract input
                let inputs = ContractInput {
                    state: initial_state.as_bytes().unwrap(),
                    identity: blob_tx.identity.clone(),
                    tx_hash: blob_tx_hash.clone(),
                    private_input: password.into_bytes().to_vec(),
                    tx_ctx: None,
                    blobs: blobs.clone(),
                    index: sdk::BlobIndex(0),
                };

                // Generate the zk proof
                let proof = prover.prove(inputs).await.unwrap();

                let proof_tx = ProofTransaction {
                    proof,
                    contract_name: contract_name.clone().into(),
                };

                // Send the proof transaction
                let proof_tx_hash = client.send_tx_proof(&proof_tx).await.unwrap();
                println!("✅ Proof tx sent. Tx hash: {}", proof_tx_hash);
            }
        }
}
