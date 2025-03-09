import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  hydentityContractName,
  // registerIdentity,
} from "@/hyle-js/src/model/hydentity";
import { PROVER_API_URL } from "@/App";
import { useState } from "react";
// import { BlobTransaction, ProofTransaction } from "@/hyle-js/src/model";
// import { node } from "@/App";

import { toast } from "sonner";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(5, {
    message: "Password must be at least 5 characters.",
  }),
});

export function Hydentity() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [action, setAction] = useState<"register" | "verify">("register");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // const identity = values.username + "." + hydentityContractName;
    const identity = values.username + "." + "simple_identity";

    setIsLoading(true);

    const res = await fetch(`${PROVER_API_URL}/${action}Identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: PROVER_API_URL,
        // contract_name: hydentityContractName,
        // contract_name: "simple_identity",
        identity: identity,
        password: values.password,
      }),
    });

    setIsLoading(false);

    const text = await res.text();

    console.log(text);
    toast(text);

    /// TODO: we would do the following in a real app

    // // blob tx
    // const idBlob = registerIdentity(identity, values.password);

    // const blobTx: BlobTransaction = {
    //   identity: identity,
    //   blobs: [idBlob],
    // };

    // const txHash = await node.sendBlobTx(blobTx);
    // console.log("registerIdentity blob tx sent", txHash);

    // // proof tx
    // const proof = {
    //   tx_hash: txHash,
    //   contract_name: hydentityContractName,
    //   identity: identity,
    //   password: values.password, // TODO: this must be a private input
    // };

    // console.log("proof", proof);

    // //  // Send proof transaction
    // //   const responseProof = await fetch(`${HYLE_PROVER_URL}/prove`, {
    // //     method: "POST",
    // //     headers: { "Content-Type": "application/json" },
    // //     body: JSON.stringify(proof),
    // //   });

    // // const proofTx: ProofTransaction = {
    // //   contract_name: hydentityContractName,
    // //   proof: responseProof,
    // // }
    // // node.sendProofTx()
  }

  return (
    // <div className="flex flex-col items-center justify-center min-h-svh">
    <div className="flex flex-col items-center justify-center min-h-svh">
      <Form {...form}>
        <h1>Hydentity</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Bob" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="mr-2"
            onClick={() => setAction("register")}
          >
            {isLoading ? "Proving..." : "Register"}
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            onClick={() => setAction("verify")}
          >
            {isLoading ? "Proving..." : "Verify"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
