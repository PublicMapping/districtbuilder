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

export type DistrictProperties = { readonly [name: string]: number };

export interface IStaticFile {
  readonly id: string;
  readonly fileName: string;
  readonly bytesPerElement: number;
}

export interface IStaticMetadata {
  readonly demographics: readonly IStaticFile[];
  readonly geoLevels: readonly IStaticFile[];
  readonly bbox: readonly [number, number, number, number];
  readonly geoLevelHierarchy: readonly string[];
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

export type RegionConfigId = string;

export type S3URI = string;
export type HttpsURI = string;

export interface IRegionConfig {
  readonly id: RegionConfigId;
  readonly name: string;
  readonly countryCode: string;
  readonly regionCode: string;
  readonly chambers: readonly IChamber[];
  readonly s3URI: S3URI;
  readonly version: Date;
}

export type ProjectId = string;

export interface IProject {
  readonly id: ProjectId;
  readonly name: string;
  readonly regionConfig: IRegionConfig;
  readonly numberOfDistricts: number;
  readonly districtsDefinition: DistrictsDefinition;
  readonly user: IUser;
}

export interface CreateProjectData {
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly regionConfig: Pick<IRegionConfig, "id">;
}

export type ChamberId = string;

export interface IChamber {
  readonly id: ChamberId;
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly regionConfig: IRegionConfig;
}
