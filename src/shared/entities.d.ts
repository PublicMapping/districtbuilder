export interface IUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export type GeoUnitCollection = number | readonly GeoUnitCollection[];

export type DistrictsDefinition = readonly GeoUnitCollection[];

export interface IDistrictsDefinition {
  readonly districts: DistrictsDefinition;
}

export interface IStaticMetadata {
  readonly id: string;
  readonly fileName: string;
  readonly bytesPerElement: number;
}

export interface Login {
  readonly email: string;
  readonly password: string;
}

export interface Register extends Login {
  readonly name: string;
}
