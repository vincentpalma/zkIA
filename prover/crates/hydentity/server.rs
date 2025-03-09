use actix_web::{web, App, HttpResponse, HttpServer};
use serde::{Deserialize, Serialize};
use client_sdk::rest_client::{IndexerApiHttpClient, NodeApiHttpClient};
use client_sdk::transaction_builder::{ProvableBlobTx, TxExecutor, TxExecutorBuilder};
use hyle_hydentity::Hydentity;
use sdk::identity_provider::IdentityAction;
use sdk::ContractName;
use sdk::Hashed;
use tracing_subscriber;
use anyhow::Result;

// This macro defines a shared state type for the transaction executor.
contract_states!(
    #[derive(Debug, Clone)]
    pub struct States {
        pub hydentity: Hydentity,
    }
);

// Build the transaction executor context by fetching the current state.
async fn build_ctx(client: &IndexerApiHttpClient) -> Result<TxExecutor<States>> {
    let initial_state: Hydentity = client
        .fetch_current_state(&"hydentity".into())
        .await?;
    let ctx = TxExecutorBuilder::new(States {
        hydentity: initial_state,
    })
    .build();
    Ok(ctx)
}

/// Request payload for the register endpoint.
#[derive(Deserialize)]
struct RegisterRequest {
    identity: String,
    password: String,
}

/// Request payload for the verify endpoint.
#[derive(Deserialize)]
struct VerifyRequest {
    identity: String,
    password: String,
    nonce: u32,
}

/// Response payload including the blob transaction hash and proof transaction hashes.
#[derive(Serialize)]
struct TxResponse {
    blob_tx_hash: String,
    proof_tx_hashes: Vec<String>,
}

/// Shared application state holding the node and indexer clients.
struct AppState {
    node: NodeApiHttpClient,
    indexer: IndexerApiHttpClient,
}

/// POST /register endpoint handler.
async fn register_handler(
    req: web::Json<RegisterRequest>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    // Build the transaction context.
    let mut ctx = build_ctx(&data.indexer).await.map_err(actix_web::error::ErrorInternalServerError)?;

    // Create a new transaction for the given identity.
    let mut transaction = ProvableBlobTx::new(req.identity.clone().into());

    // Use the client library to add the register identity action.
    hyle_hydentity::client::register_identity(
        &mut transaction,
        ContractName::new("hydentity"),
        req.password.clone(),
    )
    .map_err(actix_web::error::ErrorInternalServerError)?;

    // Process the transaction (updates internal state as needed).
    let transaction = ctx.process(transaction).map_err(actix_web::error::ErrorInternalServerError)?;

    // Send the blob transaction to the node.
    let blob_tx_hash = data.node.send_tx_blob(&transaction.to_blob_tx()).await
        .map_err(actix_web::error::ErrorInternalServerError)?;

    // For each state transition proof, send the proof transaction.
    let mut proof_tx_hashes = Vec::new();
    for proof in transaction.iter_prove() {
        let tx = proof.await.map_err(actix_web::error::ErrorInternalServerError)?;
        data.node.send_tx_proof(&tx).await
            .map_err(actix_web::error::ErrorInternalServerError)?;
        proof_tx_hashes.push(tx.hashed().to_string());
    }

    Ok(HttpResponse::Ok().json(TxResponse {
        blob_tx_hash: blob_tx_hash.to_string(),
        proof_tx_hashes,
    }))
}

/// POST /verify endpoint handler.
async fn verify_handler(
    req: web::Json<VerifyRequest>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    // Build the transaction context.
    let mut ctx = build_ctx(&data.indexer).await.map_err(actix_web::error::ErrorInternalServerError)?;

    // Create a new transaction for the given identity.
    let mut transaction = ProvableBlobTx::new(req.identity.clone().into());

    // Add the verify identity action to the transaction.
    transaction.add_action(
        "hydentity".into(),
        IdentityAction::VerifyIdentity {
            account: req.identity.clone(),
            nonce: req.nonce,
        },
        Some(req.password.clone().into_bytes()),
        None,
        None,
    )
    .map_err(actix_web::error::ErrorInternalServerError)?;

    // Process the transaction.
    let transaction = ctx.process(transaction).map_err(actix_web::error::ErrorInternalServerError)?;

    // Send the blob transaction.
    let blob_tx_hash = data.node.send_tx_blob(&transaction.to_blob_tx()).await
        .map_err(actix_web::error::ErrorInternalServerError)?;

    // Process and send each proof transaction.
    let mut proof_tx_hashes = Vec::new();
    for proof in transaction.iter_prove() {
        let tx = proof.await.map_err(actix_web::error::ErrorInternalServerError)?;
        data.node.send_tx_proof(&tx).await
            .map_err(actix_web::error::ErrorInternalServerError)?;
        proof_tx_hashes.push(tx.hashed().to_string());
    }

    Ok(HttpResponse::Ok().json(TxResponse {
        blob_tx_hash: blob_tx_hash.to_string(),
        proof_tx_hashes,
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing so that logs (e.g. via RUST_LOG) are output.
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    // Read the node host URL from the environment (or use a default).
    let host = std::env::var("HYDENTITY_HOST").unwrap_or_else(|_| "http://localhost:4321".into());

    // Create the API clients.
    let node = NodeApiHttpClient::new(host.clone())
        .expect("Failed to create NodeApiHttpClient");
    let indexer = IndexerApiHttpClient::new(host)
        .expect("Failed to create IndexerApiHttpClient");

    let app_state = web::Data::new(AppState { node, indexer });

    // Start the HTTP server on 127.0.0.1:4000.
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/register", web::post().to(register_handler))
            .route("/verify", web::post().to(verify_handler))
    })
    .bind(("127.0.0.1", 4000))?
    .run()
    .await
}
