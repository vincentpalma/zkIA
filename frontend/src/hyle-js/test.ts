// This script make some call to  the devnet node and indexer api to test the client

import { IndexerApiHttpClient, NodeApiHttpClient } from "./src/client";

import * as assert from "assert";
import { deserializeERC20Action } from "./src/model/token";
import { APIBlob } from "./src/model";
import { deserializeAmmAction } from "./src/model/amm";
import { deserializeIdentityAction } from "./src/model/mmid";
import { deserializeStakingAction } from "./src/model/staking";

var node = new NodeApiHttpClient("127.0.0.1:4321");
var indexer = new IndexerApiHttpClient("127.0.0.1:4321");

const info = await node.getNodeInfo();
console.log(info);
assert.notEqual(info.id, undefined, "Node id should be returned:");

const consensus = await node.getConsensusInfo();
assert.equal(consensus.round_leader, info.pubkey, "Round leader should be the same as the node public key");

const hyllar = await node.getContract("hyllar");
assert.equal(hyllar.name, "hyllar", "Hyllar Contract name should be hyllar");
assert.equal(hyllar.verifier, "risc0", "Hyllar verifier should be risc0");

const height = await node.getBlockHeight();
assert.ok(height > 0, "Block height should be greater than 0");
const block = await indexer.getLastBlock();
assert.ok(
    block.height == height || block.height == height + 1, // +1 because we might have done a new block betwenn the 2 api calls
    "Indexer last Block height should be equal to the node block height",
);
const block2 = await indexer.getBlockByHeight(block.height);
assert.deepEqual(block, block2, "Block by height should be the same as last block");
console.log(block);

const contracts = await indexer.listContracts();
assert.ok(contracts.length > 0, "Contracts should be listed");

const hyllar_indexer = await indexer.getIndexerContract("hyllar");
assert.equal(hyllar_indexer.contract_name, hyllar.name, "Hyllar indexer contract name should be hyllar");

const hyllar_state = await indexer.getContractState("hyllar");
// @ts-ignore
assert.ok(hyllar_state["total_supply"] > 0, "Hyllar total supply should be greater than 0");

const genesis_block = await indexer.getBlockByHeight(0);
const genesis_txs = await indexer.getTransactionsByHeight(0);

for (const gtx of genesis_txs) {
    const tx = await indexer.getTransaction(gtx.tx_hash);
    console.log("Genesis tx: ", tx.tx_hash);
    assert.equal(tx.tx_hash, gtx.tx_hash, "Transaction hash should be the same");
    assert.equal(tx.block_hash, genesis_block.hash, "Transaction block hash should be the genesis block hash");
    if (tx.transaction_type == "BlobTransaction") {
        const blobs = await indexer.getBlobsByTxHash(tx.tx_hash);
        for (const blob of blobs) {
            printBlob(blob);
        }
    }
}

function printBlob(blob: APIBlob) {
    console.log(blob.blob_index, blob.contract_name);
    if (blob.contract_name == "hyllar") {
        var data = parseHexToVec(blob.data);
        if (data == null) return;
        const action = deserializeERC20Action(data);
        console.log(action);
    } else if (blob.contract_name == "amm") {
        var data = parseHexToVec(blob.data);
        if (data == null) return;
        const action = deserializeAmmAction(data);
        console.log(action);
    } else if (blob.contract_name == "mmid") {
        var data = parseHexToVec(blob.data);
        if (data == null) return;
        const action = deserializeIdentityAction(data);
        console.log(action);
    } else if (blob.contract_name == "staking") {
        var data = parseHexToVec(blob.data);
        if (data == null) return;
        const action = deserializeStakingAction(data);
        console.log(action);
    }
}

function parseHexToVec(hex: string) {
    const tokens = hex.match(/[0-9a-f]{2}/gi); // splits the string into segments of two including a remainder => {1,2}
    return tokens?.map((t) => parseInt(t, 16));
}
