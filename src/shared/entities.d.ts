export interface IUser {
  readonly id: string;
  readonly email: string;
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
