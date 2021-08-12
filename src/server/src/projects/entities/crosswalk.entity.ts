export type FipsCode = string;

export interface CrosswalkBlocks {
  readonly fips: FipsCode;
  readonly amount: number;
}

export default interface Crosswalk {
  [newBlock: string]: readonly CrosswalkBlocks[];
}
