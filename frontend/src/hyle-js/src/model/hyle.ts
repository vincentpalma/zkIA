import { BorshSchema } from "borsher";

export type ContractName = string;
export type Identity = string;
export type ValidatorPublicKey = string;
export type TxHash = string;
export type BlockHeight = number;
export type BlockHash = string;
export type StateDigest = number[];

export interface Blob {
    contract_name: ContractName;
    data: number[];
}
export interface BlobTransaction {
    identity: Identity;
    blobs: Blob[];
}

export interface TransactionEvent {
    block_hash: string;
    block_height: number;
    events: { metadata: object; name: string }[];
}

export type BlobIndex = {
    0: number;
};

export const blobIndexSchema = BorshSchema.Struct({
    0: BorshSchema.u64,
});

export type StructuredBlobData<Parameters> = {
    caller: BlobIndex | null;
    callees: BlobIndex[] | null;
    parameters: Parameters;
};

export const structuredBlobDataSchema = (schema: BorshSchema) =>
    BorshSchema.Struct({
        caller: BorshSchema.Option(blobIndexSchema),
        callees: BorshSchema.Option(BorshSchema.Vec(blobIndexSchema)),
        parameters: schema,
    });

export interface Contract {
    name: string;
    program_id: string;
    state: number[];
    verifier: string;
}

export interface ConsensusInfo {
    slot: number;
    view: number;
    round_leader: ValidatorPublicKey;
    validators: ValidatorPublicKey[];
}

export interface APIContract {
    tx_hash: TxHash;
    verifier: string;
    program_id: string;
    state_digest: string;
    contract_name: ContractName;
}

export interface APIStaking {
    stakes: { [key: string]: number };
    delegations: { [key: ValidatorPublicKey]: Identity[] };
    rewarded: { [key: ValidatorPublicKey]: BlockHeight[] };
    bonded: ValidatorPublicKey[];
    total_bond: number;
    fees: APIFees;
}
export interface APIFees {
    balances: { [key: ValidatorPublicKey]: APIFeesBalance };
}
export interface APIFeesBalance {
    balance: number;
    cumul_size: number;
}
export interface NodeInfo {
    id: string;
    pubkey: ValidatorPublicKey | null;
    da_address: string;
}
export interface APIBlock {
    hash: string;
    parent_hash: string;
    height: number;
    timestamp: number;
}
export interface APITransaction {
    tx_hash: string;
    parent_dp_hash: string;
    version: number;
    transaction_type: string;
    transaction_status: string;
    block_hash: string | null;
    index: number | null;
}
export interface TransactionWithBlobs {
    tx_hash: string;
    parent_dp_hash: string;
    version: number;
    transaction_type: string;
    transaction_status: string;
    identity: Identity;
    blobs: BlobWithStatus[];
}
export interface BlobWithStatus {
    contract_name: ContractName;
    data: string;
    proof_outputs: any[];
}
export interface APIBlob {
    tx_hash: string;
    blob_index: number;
    identity: Identity;
    contract_name: ContractName;
    data: string;
    verified: boolean;
}
export interface ProofTransaction {
    contract_name: ContractName;
    proof: number[];
}
export interface TransactionEvent {
    block_hash: string;
    block_height: number;
    events: {
        metadata: object;
        name: string;
    }[];
}
