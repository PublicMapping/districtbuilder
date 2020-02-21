export interface IUser {
  readonly id: string;
  readonly email: string;
}

export type GeoUnitCollection = number | readonly GeoUnitCollection[];

export type DistrictsDefinition = readonly GeoUnitCollection[];

export interface IDistrictsDefinition {
  readonly districts: DistrictsDefinition;
}
