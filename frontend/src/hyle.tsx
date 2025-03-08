// fro reference, from https://github.com/Hyle-org/metamask-id/blob/main/hyle-snap/packages/snap/src/hyle.tsx

// // lib/hyle.ts

// import { IdentityAction, serializeIdentityAction } from "./model/mmid";

// // Basic types from SDK
// export type TxHash = string;
// export type BlockHeight = number;
// export type ContractName = string;
// export type StateDigest = string;
// export type Identity = string;
// export type ValidatorPublicKey = string; // Assuming this is a string-based key
// export type ProgramId = string;
// export type Verifier = string;

// export interface HyleOutput {
//   version: number;
//   initial_state: StateDigest;
//   next_state: StateDigest;
//   identity: Identity;
//   tx_hash: TxHash;
//   index: number;
//   blobs: number[];
//   success: boolean;
//   program_outputs: number[];
// }

// // lib/myFile.ts
// export interface BlobData {
//   data: Uint8Array;
// }

// // Core interfaces matching Rust types
// export interface Blob {
//   contract_name: ContractName;
//   data: number[];
// }

// export interface BlobTransaction {
//   identity: Identity;
//   blobs: Blob[];
// }

// export interface Proof {
//   tx_hash: TxHash;
//   contract_name: ContractName;
//   identity: Identity;
//   signature: string;
// }

// export interface ProofTransaction {
//   contract_name: ContractName;
//   proof: number[];
// }

// export const contract_name: Identity = "mmid";
// export const HYLE_NODE_URL = "http://localhost:4321";
// export const HYLE_PROVER_URL = "http://localhost:4000";

// export async function getIdentity(): Promise<string> {
//   const ethAddr = await ethereum.request({
//     method: "eth_requestAccounts",
//   });

//   return ethAddr + "." + contract_name;
// }

// export async function registerIdentity(signature: string) {
//   const ethAddr = await ethereum.request({
//     method: "eth_requestAccounts",
//   });

//   const identity = ethAddr + "." + contract_name;

//   const action: IdentityAction = {
//     RegisterIdentity: { account: identity },
//   };

//   // Create the blob
//   const blob: Blob = {
//     contract_name: contract_name,
//     data: serializeIdentityAction(action),
//   };

//   // Create the blob transaction
//   const blobTx: BlobTransaction = {
//     identity: identity,
//     blobs: [blob],
//   };

//   console.log("blobTx generated", blobTx);

//   // Send blob transaction
//   const response = await fetch(`${HYLE_NODE_URL}/v1/tx/send/blob`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(blobTx),
//   });

//   console.log("blobTx sent");

//   const txHash = await response.json();

//   // Create proof
//   const proof: Proof = {
//     tx_hash: txHash,
//     contract_name: contract_name,
//     identity: identity,
//     signature: signature,
//   };

//   // Send proof transaction
//   const responseProof = await fetch(`${HYLE_PROVER_URL}/prove`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(proof),
//   });

//   const generatedProof = await responseProof.text();

//   return generatedProof;
// }
