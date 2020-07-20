export type UserId = string;

export interface IUser {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly isEmailVerified: boolean;
}

export type GeoUnitCollection = number | GeoUnitCollection[];

export interface GeoUnitDefinition {
  readonly groups: ReadonlyArray<string>;
}

export type DistrictsDefinition = GeoUnitCollection[];

interface NestedArray<T> extends Array<T | NestedArray<T>> {}

export type GeoUnitHierarchy = NestedArray<number>;

export type HierarchyDefinition = readonly GeoUnitCollection[];

export interface IDistrictsDefinition {
  readonly districts: DistrictsDefinition;
}

export type DistrictProperties = { readonly [name: string]: number };

export interface IStaticFile {
  readonly id: string;
  readonly fileName: string;
  readonly bytesPerElement: number;
}

export interface GeoLevelInfo {
  readonly id: string;
  readonly maxZoom: number;
  readonly minZoom: number;
}

export interface IStaticMetadata {
  readonly demographics: readonly IStaticFile[];
  readonly geoLevels: readonly IStaticFile[];
  readonly bbox: readonly [number, number, number, number];
  readonly geoLevelHierarchy: readonly GeoLevelInfo[];
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

// export interface GeoUnitData {
//   readonly id: number;
//   readonly [x: string]: number; // Store ids for parent/grandparent geolevels
// }

export type GeoUnitData = number[];
