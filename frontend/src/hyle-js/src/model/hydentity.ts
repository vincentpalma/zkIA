import { borshSerialize, BorshSchema, borshDeserialize } from "borsher";
import { Blob } from "./hyle";

export const hydentityContractName = "hydentity";

//
// Types
//

// old (for mmid)
// export type IdentityAction =
//     | {
//           RegisterIdentity: {
//               signature: string;
//           };
//       }
//     | {
//           VerifyIdentity: {
//               nonce: number;
//               signature: string;
//           };
//       };

export type IdentityAction =
    | {
          RegisterIdentity: {
              identity: string;
              password: string;
          };
      }
    | {
          VerifyIdentity: {
            identity: string;
            password: string;
            nonce: number;
          };
      };

//
// Builders
//

export const registerIdentity = (identity: string, password: string): Blob => {
    const action: IdentityAction = {
        RegisterIdentity: { identity, password },
    };
    const blob: Blob = {
        contract_name: hydentityContractName,
        data: serializeIdentityAction(action),
    };
    return blob;
};

export const verifyIdentity = (identity: string, password: string, nonce: number): Blob => {
    const action: IdentityAction = {
        VerifyIdentity: { identity, password, nonce },
    };

    const blob: Blob = {
        contract_name: hydentityContractName,
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
        // signature: BorshSchema.String,
        identity: BorshSchema.String,
        password: BorshSchema.String,
    }),
    VerifyIdentity: BorshSchema.Struct({
        // nonce: BorshSchema.u128,
        // signature: BorshSchema.String,
        identity: BorshSchema.String,
        password: BorshSchema.String,
        nonce: BorshSchema.u32,
    }),
});
