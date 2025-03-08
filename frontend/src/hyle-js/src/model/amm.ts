import { borshSerialize, BorshSchema, borshDeserialize } from "borsher";
import { ContractName, Blob } from "./hyle";
import { BlobIndex, StructuredBlobData, structuredBlobDataSchema } from "./hyle";
import * as token from "./token";

//
// Types
//

export type TokenPair = [string, string];
export type TokenPairAmount = [number, number];

export type AmmAction =
    | {
          Swap: {
              pair: TokenPair;
              amounts: TokenPairAmount;
          };
      }
    | {
          NewPair: {
              pair: TokenPair;
              amounts: TokenPairAmount;
          };
      };

//
// Builders
//

export const swap_blob = (
    token_a: ContractName,
    token_b: ContractName,
    amount_a: number,
    amount_b: number,
    callees: number[] | null,
): Blob => {
    const action: AmmAction = {
        Swap: { pair: [token_a, token_b], amounts: [amount_a, amount_b] },
    };

    const structured: StructuredBlobData<AmmAction> = {
        caller: null,
        callees: callees ? callees.map((c): BlobIndex => ({ 0: c })) : null,
        parameters: action,
    };

    const blob: Blob = {
        contract_name: "amm",
        data: serializeAmmAction(structured),
    };
    return blob;
};

export function swap(account: string, fromToken: string, toToken: string, amount_a: number, amount_b: number): Blob[] {
    // Blob 0 is identity
    // Blob 1
    const allow: Blob = token.approve(fromToken, "amm", amount_a);

    // Blob 2
    const swap: Blob = swap_blob(fromToken, toToken, amount_a, amount_b, [3, 4]);

    // Blob 3
    const transferFrom: Blob = token.transferFrom(account, "amm", fromToken, amount_a, 2);

    // Blob 4
    const transfer: Blob = token.transfer(account, toToken, amount_b, 2);

    return [allow, swap, transferFrom, transfer];
}

//
// Serialisation
//

export const serializeAmmAction = (action: StructuredBlobData<AmmAction>): number[] => {
    return Array.from(borshSerialize(structuredBlobDataSchema(ammSchema), action));
};
export const deserializeAmmAction = (data: number[]): StructuredBlobData<AmmAction> => {
    return borshDeserialize(structuredBlobDataSchema(ammSchema), Buffer.from(data));
};

const ammSchema = BorshSchema.Enum({
    Swap: BorshSchema.Struct({
        pair: BorshSchema.Struct({ 0: BorshSchema.String, 1: BorshSchema.String }),
        amounts: BorshSchema.Struct({ 0: BorshSchema.u128, 1: BorshSchema.u128 }),
    }),
    NewPair: BorshSchema.Struct({
        pair: BorshSchema.Struct({ 0: BorshSchema.String, 1: BorshSchema.String }),
        amounts: BorshSchema.Struct({ 0: BorshSchema.u128, 1: BorshSchema.u128 }),
    }),
});
