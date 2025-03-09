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

import { PROVER_API_URL } from "@/App";
import { useState } from "react";

import { toast } from "sonner";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(5, {
    message: "Password must be at least 5 characters.",
  }),
  transferAmount: z.number().min(1, {
    message: "Transfer amount must be at least 1 token.",
  }),
  transferRecipient: z
    .string()
    .min(2, {
      message: "Transfer recipient must be at least 2 characters.",
    })
    .email("This is not a valid email."),
});

export function ZkIA() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      transferAmount: 1,
      transferRecipient: "none@gmail.com",
    },
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [action, setAction] = useState<"register" | "verify" | "transfer">(
    "register"
  );

  const [registeredUser, setRegisteredUser] = useState<string>("");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("submit", action);

    const identity = values.username + "." + "simple_identity";

    setIsLoading(true);

    const res = await fetch(`${PROVER_API_URL}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: PROVER_API_URL,
        identity: identity,
        password: values.password,
        transferAmount: values.transferAmount,
        transferRecipient: values.transferRecipient,
      }),
    });

    setIsLoading(false);

    const text = await res.text();

    if (action == "register") {
      setRegisteredUser(text);
    }

    console.log(text);
    toast(text);
  }

  return (
    // <div className="flex flex-col items-center justify-center min-h-svh">
    <div>
      <Form {...form}>
        <h1>zkIA</h1>

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
            // className="mr-2"
            onClick={() => setAction("verify")}
          >
            {isLoading ? "Proving..." : "Verify"}
          </Button>

          <FormField
            control={form.control}
            name="transferAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1"
                    {...field}
                    disabled={registeredUser == ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transferRecipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient (email)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="bob@gmail.com"
                    {...field}
                    disabled={registeredUser == ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isLoading || registeredUser == ""}
            onClick={() => setAction("transfer")}
          >
            {isLoading ? "Proving..." : "transfer"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
