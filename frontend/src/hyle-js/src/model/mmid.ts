import { borshSerialize, BorshSchema, borshDeserialize } from "borsher";
// import { Blob } from "@/model/hyle";
import { Blob } from "./hyle";

export const mmidContractName = "mmid";

//
// Types
//

export type IdentityAction =
    | {
          RegisterIdentity: {
              signature: string;
          };
      }
    | {
          VerifyIdentity: {
              nonce: number;
              signature: string;
          };
      };

//
// Builders
//

export const register = (signature: string): Blob => {
    const action: IdentityAction = {
        RegisterIdentity: { signature },
    };
    const blob: Blob = {
        contract_name: mmidContractName,
        data: serializeIdentityAction(action),
    };
    return blob;
};

export const verifyIdentity = (nonce: number, signature: string): Blob => {
    const action: IdentityAction = {
        VerifyIdentity: { nonce, signature },
    };

    const blob: Blob = {
        contract_name: mmidContractName,
        data: serializeIdentityAction(action),
    };
    return blob;
};

//
// Serialisation
//

const serializeIdentityAction = (action: IdentityAction): number[] => {
    return Array.from(borshSerialize(schema, action));
};
export const deserializeIdentityAction = (data: number[]): IdentityAction => {
    return borshDeserialize(schema, Buffer.from(data));
};

const schema = BorshSchema.Enum({
    RegisterIdentity: BorshSchema.Struct({
        signature: BorshSchema.String,
    }),
    VerifyIdentity: BorshSchema.Struct({
        nonce: BorshSchema.u128,
        signature: BorshSchema.String,
    }),
});
