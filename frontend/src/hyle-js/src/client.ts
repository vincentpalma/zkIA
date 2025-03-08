// import { URL } from "url";
import {
    APIBlob,
    APIBlock,
    APIContract,
    APITransaction,
    BlobTransaction,
    BlockHash,
    BlockHeight,
    ConsensusInfo,
    Contract,
    ContractName,
    NodeInfo,
    ProofTransaction,
    TransactionWithBlobs,
    TransactionEvent,
    TxHash,
} from "./model";

export class NodeApiHttpClient {
    url: URL;
    reqwestClient: any;

    constructor(url: string) {
        this.url = new URL(url);
        this.reqwestClient = fetch; // Utilisation de fetch pour les requêtes HTTP
    }

    async registerContract(tx: any): Promise<TxHash> {
        return this.post("v1/contract/register", tx, "Registering contract");
    }

    async sendBlobTx(tx: BlobTransaction): Promise<TxHash> {
        return this.post("v1/tx/send/blob", tx, "Sending tx blob");
    }

    async sendProofTx(tx: ProofTransaction): Promise<TxHash> {
        return this.post("v1/tx/send/proof", tx, "Sending tx proof");
    }

    async getConsensusInfo(): Promise<ConsensusInfo> {
        return this.get("v1/consensus/info", "getting consensus info");
    }

    async getNodeInfo(): Promise<NodeInfo> {
        return this.get("v1/info", "getting node info");
    }

    async getBlockHeight(): Promise<BlockHeight> {
        return this.get("v1/da/block/height", "getting block height");
    }

    async getContract(contractName: ContractName): Promise<Contract> {
        return this.get(`v1/contract/${contractName}`, `getting contract ${contractName}`);
    }

    private async get<T>(endpoint: string, contextMsg: string): Promise<T> {
        const response = await fetch(`${this.url.toString()}${endpoint}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`${contextMsg} request failed`);
        }

        return response.json();
    }

    private async post<T, R>(endpoint: string, body: T, contextMsg: string): Promise<R> {
        const response = await fetch(`${this.url.toString()}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`${contextMsg} request failed`);
        }

        return response.json();
    }
}

export class IndexerApiHttpClient {
    url: URL;
    reqwestClient: any;

    constructor(url: string) {
        this.url = new URL(url);
        this.reqwestClient = fetch; // Utilisation de fetch pour les requêtes HTTP
    }

    async listContracts(): Promise<APIContract[]> {
        return this.get("v1/indexer/contracts", "listing contracts");
    }

    async getIndexerContract(contractName: ContractName): Promise<APIContract> {
        return this.get(`v1/indexer/contract/${contractName}`, `getting contract ${contractName}`);
    }

    async getContractState(contractName: ContractName): Promise<object> {
        return this.get(`v1/indexer/contract/${contractName}/state`, `getting contract ${contractName} state`);
    }

    async getBlocks(): Promise<APIBlock[]> {
        return this.get("v1/indexer/blocks", "getting blocks");
    }

    async getLastBlock(): Promise<APIBlock> {
        return this.get("v1/indexer/block/last", "getting last block");
    }

    async getBlockByHeight(height: BlockHeight): Promise<APIBlock> {
        return this.get(`v1/indexer/block/height/${height}`, `getting block with height ${height}`);
    }

    async getBlockByHash(hash: BlockHash): Promise<APIBlock> {
        return this.get(`v1/indexer/block/hash/${hash}`, `getting block with hash ${hash}`);
    }

    async getTransactions(): Promise<APITransaction[]> {
        return this.get("v1/indexer/transactions", "getting transactions");
    }

    async getTransactionsByHeight(height: BlockHeight): Promise<APITransaction[]> {
        return this.get(`v1/indexer/transactions/block/${height}`, `getting transactions for block height ${height}`);
    }

    async getTransactionsByContract(contractName: ContractName): Promise<APITransaction[]> {
        return this.get(`v1/indexer/transactions/contract/${contractName}`, `getting transactions for contract ${contractName}`);
    }

    async getTransaction(txHash: TxHash): Promise<APITransaction> {
        return this.get(`v1/indexer/transaction/hash/${txHash}`, `getting transaction ${txHash}`);
    }

    async getTransactionEvents(txHash: TxHash): Promise<TransactionEvent> {
        return this.get(`v1/indexer/transaction/hash/${txHash}/events`, `getting transaction events for ${txHash}`);
    }

    async getBlobTransactionsByContract(contractName: ContractName): Promise<TransactionWithBlobs[]> {
        return this.get(`v1/indexer/blob_transactions/contract/${contractName}`, `getting blob transactions for contract ${contractName}`);
    }

    async getBlobsByTxHash(txHash: TxHash): Promise<APIBlob[]> {
        return this.get(`v1/indexer/blobs/hash/${txHash}`, `getting blob by transaction hash ${txHash}`);
    }

    async getBlob(txHash: TxHash, blobIndex: number): Promise<APIBlob> {
        return this.get(`v1/indexer/blob/hash/${txHash}/index/${blobIndex}`, `getting blob with hash ${txHash} and index ${blobIndex}`);
    }

    private async get<T>(endpoint: string, contextMsg: string): Promise<T> {
        const response = await fetch(`${this.url.toString()}${endpoint}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`${contextMsg} request failed`);
        }

        return response.json();
    }
}
