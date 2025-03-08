"use client";

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
  registerIdentity,
} from "@/hyle-js/src/model/hydentity";
import { BlobTransaction, ProofTransaction } from "@/hyle-js/src/model";
import { node } from "@/App";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(5, {
    message: "Password must be at least 5 characters.",
  }),
});

export function Hydentity() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const identity = values.username + "." + hydentityContractName;

    // blob tx
    const idBlob = registerIdentity(identity, values.password);

    const blobTx: BlobTransaction = {
      identity: identity,
      blobs: [idBlob],
    };

    const txHash = await node.sendBlobTx(blobTx);
    console.log("registerIdentity blob tx sent", txHash);

    // proof tx
    const proof = {
      tx_hash: txHash,
      contract_name: hydentityContractName,
      identity: identity,
      password: values.password, // TODO: this must be a private input
    };

    console.log("proof", proof);

    //  // Send proof transaction
    //   const responseProof = await fetch(`${HYLE_PROVER_URL}/prove`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(proof),
    //   });

    // TODO: come back here after having created the backend
    // const proofTx: ProofTransaction = {
    //   contract_name: hydentityContractName,
    //   proof: responseProof,
    // }
    // node.sendProofTx()
  }

  return (
    <Form {...form}>
      <h1>Register Hydentity</h1>

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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
