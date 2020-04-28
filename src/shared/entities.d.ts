export type UserId = string;

export interface IUser {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly isEmailVerified: boolean;
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

export type JWT = string;

export type JWTPayload = IUser & {
  readonly exp: number;
  readonly iat: number;
  readonly sub: UserId;
};

type RegionConfigId = string;

export interface IRegionConfig {
  readonly id: RegionConfigId;
  readonly name: string;
  readonly countryCode: string;
  readonly regionCode: string;
  readonly chambers: readonly IChamber[];
  readonly version: Date;
}

type ProjectId = string;

export interface IProject {
  readonly id: ProjectId;
  readonly name: string;
  readonly regionConfig: IRegionConfig;
  readonly user: IUser;
}

export interface CreateProjectData {
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly regionConfig: Pick<IRegionConfig, "id">;
}

export interface IChamber {
  readonly id: string;
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly regionConfig: IRegionConfig;
}
