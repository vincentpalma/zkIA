//
// Types
//

import { borshDeserialize, BorshSchema, borshSerialize } from "borsher";
import { StructuredBlobData, structuredBlobDataSchema } from "./hyle";

export type StakingAction =
    | {
          Stake: {
              amount: number;
          };
      }
    | {
          Delegate: {
              validator: number[];
          };
      }
    | {
          Distribute: {
              claim: RewardsClaim;
          };
      }
    | {
          DepositForFees: {
              holder: number[];
              amount: number;
          };
      };

export interface RewardsClaim {
    block_heights: number[];
}

//
// Serialisation
//

export const serializeStakingAction = (action: StructuredBlobData<StakingAction>): number[] => {
    return Array.from(borshSerialize(structuredBlobDataSchema(stakingSchema), action));
};

export const deserializeStakingAction = (data: number[]): StakingAction => {
    return borshDeserialize(structuredBlobDataSchema(stakingSchema), Buffer.from(data));
};

export const stakingSchema = BorshSchema.Enum({
    Stake: BorshSchema.Struct({
        amount: BorshSchema.u64,
    }),
    Delegate: BorshSchema.Struct({
        validator: BorshSchema.Vec(BorshSchema.u8),
    }),
    Distribute: BorshSchema.Struct({
        claim: BorshSchema.Struct({ block_heights: BorshSchema.Vec(BorshSchema.u64) }),
    }),
    DepositForFees: BorshSchema.Struct({
        holder: BorshSchema.Vec(BorshSchema.u8),
        amount: BorshSchema.u64,
    }),
});
