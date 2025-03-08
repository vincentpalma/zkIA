import { borshSerialize, BorshSchema, borshDeserialize } from "borsher";
import { ContractName, Blob, StructuredBlobData, structuredBlobDataSchema } from "./hyle";

//
// Types
//

export type ERC20Action =
    | { TotalSupply: {} }
    | { BalanceOf: { account: string } }
    | { Transfer: { recipient: string; amount: number } }
    | { TransferFrom: { sender: string; recipient: string; amount: number } }
    | { Approve: { spender: string; amount: number } }
    | { Allowance: { owner: string; spender: string } };

//
// Builders
//

export const approve = (token: ContractName, spender: string, amount: number): Blob => {
    const action: ERC20Action = {
        Approve: { spender, amount },
    };
    const structured: StructuredBlobData<ERC20Action> = {
        caller: null,
        callees: null,
        parameters: action,
    };
    const blob: Blob = {
        contract_name: token,
        data: serializeERC20Action(structured),
    };
    return blob;
};

export const transferFrom = (sender: string, recipient: string, token: ContractName, amount: number, caller: number | null): Blob => {
    const action: ERC20Action = {
        TransferFrom: { sender, recipient, amount },
    };

    const structured: StructuredBlobData<ERC20Action> = {
        caller: caller ? { 0: caller } : null,
        callees: null,
        parameters: action,
    };

    const blob: Blob = {
        contract_name: token,
        data: serializeERC20Action(structured),
    };
    return blob;
};

export const transfer = (recipient: string, token: ContractName, amount: number, caller: number | null): Blob => {
    const action: ERC20Action = {
        Transfer: { recipient, amount },
    };

    const structured: StructuredBlobData<ERC20Action> = {
        caller: caller ? { 0: caller } : null,
        callees: null,
        parameters: action,
    };

    const blob: Blob = {
        contract_name: token,
        data: serializeERC20Action(structured),
    };
    return blob;
};

//
// Serialisation
//

export const serializeERC20Action = (action: StructuredBlobData<ERC20Action>): number[] => {
    return Array.from(borshSerialize(structuredBlobDataSchema(erc20Schema), action));
};
export const deserializeERC20Action = (data: number[]): StructuredBlobData<ERC20Action> => {
    return borshDeserialize(structuredBlobDataSchema(erc20Schema), Buffer.from(data));
};

export const erc20Schema = BorshSchema.Enum({
    TotalSupply: BorshSchema.Unit,

    BalanceOf: BorshSchema.Struct({
        account: BorshSchema.String,
    }),

    Transfer: BorshSchema.Struct({
        recipient: BorshSchema.String,
        amount: BorshSchema.u128,
    }),

    TransferFrom: BorshSchema.Struct({
        sender: BorshSchema.String,
        recipient: BorshSchema.String,
        amount: BorshSchema.u128,
    }),

    Approve: BorshSchema.Struct({
        spender: BorshSchema.String,
        amount: BorshSchema.u128,
    }),

    Allowance: BorshSchema.Struct({
        owner: BorshSchema.String,
        spender: BorshSchema.String,
    }),
});
