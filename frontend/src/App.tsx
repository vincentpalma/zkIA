import { useAuth } from "react-oidc-context";
import { Button } from "./components/ui/button";

import { IndexerApiHttpClient, NodeApiHttpClient } from "@/hyle-js/src/client";

import { deserializeERC20Action } from "@/hyle-js/src/model/token";
import { APIBlob } from "@/hyle-js/src/model";
import { deserializeAmmAction } from "@/hyle-js/src/model/amm";
import { deserializeIdentityAction } from "@/hyle-js/src/model/mmid";
import { deserializeStakingAction } from "@/hyle-js/src/model/staking";
import { Hydentity } from "./components/Hydentity";

export const node = new NodeApiHttpClient("http://127.0.0.1:4321");
export const indexer = new IndexerApiHttpClient("http://127.0.0.1:4321");

async function runTests() {
  const info = await node.getNodeInfo();
  console.log(info);

  const consensus = await node.getConsensusInfo();
  console.log(consensus);

  const hyllar = await node.getContract("hyllar");
  console.log(hyllar);

  // const height = await node.getBlockHeight();
  // console.log(height);

  // const block = await indexer.getLastBlock();
  // console.log(block);

  const contracts = await indexer.listContracts();
  console.log(contracts);

  // const hyllar_indexer = await indexer.getIndexerContract("hyllar");
  // console.log(hyllar_indexer);

  // const genesis_block = await indexer.getBlockByHeight(0);
  const genesis_txs = await indexer.getTransactionsByHeight(0);

  for (const gtx of genesis_txs) {
    const tx = await indexer.getTransaction(gtx.tx_hash);
    console.log("Genesis tx: ", tx.tx_hash);
    if (tx.transaction_type == "BlobTransaction") {
      const blobs = await indexer.getBlobsByTxHash(tx.tx_hash);
      for (const blob of blobs) {
        printBlob(blob);
      }
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

function App() {
  const auth = useAuth();

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
  }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        Hello {auth.user?.profile.name} ,
        <pre>{JSON.stringify(auth.user, null, 2)}</pre>
        <Button onClick={() => void auth.removeUser()}>Log out</Button>
        <Button onClick={runTests}>Run Hyle tests (Debug)</Button>
        <Hydentity />
      </div>
    );
  }

  return <Button onClick={() => void auth.signinRedirect()}>Log in</Button>;
}

export default App;

// TODO: make the following work (automatic sign in)

// import React from "react";
// import { useAuth, hasAuthParams } from "react-oidc-context";
// import { Button } from "@/components/ui/button";

// function App() {
//   // return (
//   //   <div className="flex flex-col items-center justify-center min-h-svh">
//   //     <Button>Click me</Button>
//   //   </div>
//   // )
//   const auth = useAuth();
//   const [hasTriedSignin, setHasTriedSignin] = React.useState(false);

//   // automatically sign-in
//   React.useEffect(() => {
//     if (
//       !hasAuthParams() &&
//       !auth.isAuthenticated &&
//       !auth.activeNavigator &&
//       !auth.isLoading &&
//       !hasTriedSignin
//     ) {
//       auth.signinRedirect();
//       setHasTriedSignin(true);
//     }
//   }, [auth, hasTriedSignin]);

//   if (auth.isLoading) {
//     return <div>Signing you in/out...</div>;
//   }

//   if (!auth.isAuthenticated) {
//     return <div>Unable to log in</div>;
//   }

//   return <Button onClick={() => void auth.removeUser()}>Log out</Button>;
// }

// export default App;
