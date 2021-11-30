import { ProjectVisibility, ReferenceLayerTypes } from "./constants";

export type UserId = string;

export type PublicUserProperties = "id" | "name" | "email";

export type PaginationMetadata = {
  readonly currentPage: number;
  readonly limit: number;
  readonly totalItems?: number;
  readonly totalPages?: number;
};

export type OrganizationNest = Pick<
  IOrganization,
  "slug" | "id" | "name" | "logoUrl" | "projectTemplates"
>;

export interface IUser {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly isEmailVerified: boolean;
  readonly hasSeenTour: boolean;
  readonly organizations: readonly OrganizationNest[];
}

export type UpdateUserData = Pick<IUser, "name" | "hasSeenTour">;

export type OrganizationSlug = string;

export interface IOrganization {
  readonly id: string;
  readonly slug: OrganizationSlug;
  readonly name: string;
  readonly description: string;
  readonly logoUrl: string;
  readonly linkUrl: string;
  readonly municipality: string;
  readonly region: string;
  readonly admin?: IUser;
  readonly users: readonly IUser[];
  readonly projectTemplates: readonly IProjectTemplate[];
}

export interface AddUser {
  readonly userId: UserId;
}

export type GeoUnitCollection = number | readonly GeoUnitCollection[];

// eslint-disable-next-line
export type MutableGeoUnitCollection = number | GeoUnitCollection[];

export interface GeoUnitDefinition {
  readonly groups: ReadonlyArray<string>;
}

// eslint-disable-next-line
export type DistrictsDefinition = MutableGeoUnitCollection[];

type NestedArray<T> = ReadonlyArray<T | NestedArray<T>>;

export type GeoUnitHierarchy = NestedArray<number>;

export type HierarchyDefinition = readonly GeoUnitCollection[];

export interface IDistrictsDefinition {
  readonly districts: DistrictsDefinition;
}

export interface DemographicCounts {
  // key is demographic group (eg. population, white, black, etc)
  // value is the number of people in that group
  readonly [id: string]: number;
}

export type DistrictProperties = {
  readonly contiguity: "contiguous" | "non-contiguous" | "";
  readonly compactness: number;
  readonly demographics: DemographicCounts;
  readonly voting?: DemographicCounts;
  /* eslint-disable */
  // NOTE: These properties are set for styling purposes
  id?: number;
  color?: string;
  findOutlineColor?: string;
  percentDeviation?: number;
  pvi?: number;
  populationDeviation?: number;
  majorityRace?: string;
  majorityRaceSplit?: number;
  majorityRaceFill?: string;
  outlineWidthScaleFactor?: number;
  /* eslint-enable */
};

export interface IStaticFile {
  readonly id: string;
  readonly fileName: string;
  readonly bytesPerElement: number;
  readonly unsigned?: boolean;
}

export interface GeoLevelInfo {
  readonly id: string;
  readonly maxZoom: number;
  readonly minZoom: number;
}

export type GeoLevelHierarchy = readonly GeoLevelInfo[];
export interface DemographicsGroup {
  readonly subgroups: readonly string[];
  readonly total?: string;
  readonly tooltip?: string;
}

export interface IStaticMetadata {
  readonly demographics: readonly IStaticFile[];
  readonly geoLevels: readonly IStaticFile[];
  readonly voting?: readonly IStaticFile[];
  readonly demographicsGroups?: readonly DemographicsGroup[];
  readonly bbox: readonly [number, number, number, number];
  readonly geoLevelHierarchy: GeoLevelHierarchy;
}

export interface Login {
  readonly email: string;
  readonly password: string;
}

export interface Register extends Login {
  readonly name: string;
  readonly organization?: string;
}

export interface ResetPassword {
  readonly password: string;
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
export type RegionCode = string;

export interface IRegionConfig {
  readonly id: RegionConfigId;
  readonly name: string;
  readonly countryCode: string;
  readonly regionCode: RegionCode;
  readonly chambers: readonly IChamber[];
  readonly s3URI: S3URI;
  readonly version: Date;
  readonly hidden: boolean;
  readonly archived: boolean;
}

export interface IReferenceLayer {
  readonly id: ReferenceLayerId;
  readonly name: string;
  readonly layer_type: ReferenceLayerTypes.Point | ReferenceLayerTypes.Polygon;
  readonly label_field: string;
}

export interface ReferenceLayerProperties {
  // key is a property name on the geojson
  // value is the value for that property
  readonly [id: string]: number | string;
}

export type VotingMetricField = "dem16" | "rep16" | "other16" | "dem20" | "rep20" | "other20";

export type MetricsList = readonly (readonly [string, string])[];
export type VotingMetricsList = readonly (readonly [string, VotingMetricField])[];

export interface ProjectTemplateFields {
  readonly name: string;
  readonly regionConfig: IRegionConfig;
  readonly numberOfDistricts: number;
  readonly chamber?: IChamber;
  readonly populationDeviation: number;
  readonly pinnedMetricFields: readonly string[];
  readonly numberOfMembers: readonly number[];
  readonly districtsDefinition: DistrictsDefinition;
}

export type ProjectId = string;

export type ReferenceLayerId = string;

export type IProject = ProjectTemplateFields & {
  readonly id: ProjectId;
  readonly createdDt: Date;
  readonly updatedDt: Date;
  readonly user: Pick<IUser, PublicUserProperties>;
  readonly projectTemplate?: IProjectTemplate;
  readonly advancedEditingEnabled: boolean;
  readonly isFeatured: boolean;
  readonly lockedDistricts: readonly boolean[];
  readonly visibility: ProjectVisibility;
  readonly archived: boolean;
};

export type ProjectNest = Pick<
  IProject,
  | "user"
  | "id"
  | "updatedDt"
  | "numberOfDistricts"
  | "name"
  | "regionConfig"
  | "isFeatured"
  | "visibility"
> & {
  readonly regionConfig: Pick<IRegionConfig, "name">;
};

export interface CreateProjectData {
  readonly name?: string;
  readonly numberOfDistricts?: number;
  readonly numberOfMembers?: readonly number[];
  readonly regionConfig: Pick<IRegionConfig, "id">;
  readonly chamber?: Pick<IChamber, "id"> | null;
  readonly districtsDefinition?: DistrictsDefinition;
  readonly populationDeviation?: number;
  readonly projectTemplate?: Pick<IProjectTemplate, "id">;
}

export interface CreateReferenceLayerData {
  readonly name: string;
  readonly project: Pick<IProject, "id">;
  readonly layer_type: ReferenceLayerTypes.Point | ReferenceLayerTypes.Polygon;
  readonly label_field?: string;
}

export type UpdateProjectData = Pick<
  IProject,
  | "name"
  | "districtsDefinition"
  | "advancedEditingEnabled"
  | "lockedDistricts"
  | "pinnedMetricFields"
  | "visibility"
  | "archived"
>;

export type ProjectTemplateId = string;

export type IProjectTemplate = ProjectTemplateFields & {
  readonly id: ProjectTemplateId;
  readonly organization: IOrganization;
  readonly description: string;
  readonly details: string;
  readonly referenceLayers?: readonly IReferenceLayer[];
};

export type IProjectTemplateWithProjects = IProjectTemplate & {
  readonly projects: readonly ProjectNest[];
};

export type ChamberId = string;

export interface IChamber {
  readonly id: ChamberId;
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly numberOfMembers?: readonly number[];
  readonly regionConfig: IRegionConfig;
}

// For a given geounit, the indices at each geolevel from largest to smallest geounits.
// The smaller the geounit, the more indices will be present to place it in the hierarchy.
// This is used to place a geounit within the geounit hierarchy when building district definitions.
// For example:
// a block may have indices [0, 81, 124] where 0 = county, 81 = tract, 124 = block
// a tract may have indices [0, 81] where 0 = county, 81 = tract
// a county may have indices [0] where 0 = county
export type GeoUnitIndices = readonly number[];

export type FeatureId = number;

// Geounits are partitioned by level to avoid feature id collisions
// Feature ids are used to describe internal order for geounits at a given level
export type GeoUnitsForLevel = ReadonlyMap<FeatureId, GeoUnitIndices>;

export interface GeoUnits {
  readonly [geoLevelId: string]: GeoUnitsForLevel;
}

export interface MutableGeoUnits {
  // eslint-disable-next-line
  [geoLevelId: string]: Map<FeatureId, GeoUnitIndices>;
}

export type Contiguity = "" | "contiguous" | "non-contiguous";

export type DistrictId = number;

export type LockedDistricts = readonly boolean[];

export type UintArray = Uint8Array | Uint16Array | Uint32Array;
export type IntArray = Int8Array | Int16Array | Int32Array;
export type TypedArray = UintArray | IntArray;
export type TypedArrays = ReadonlyArray<TypedArray>;
export type RegionLookupProperties = Record<string, unknown>;

export type DistrictImportField = "" | "BLOCKID" | "DISTRICT";

export interface ImportRowFlag {
  readonly rowNumber: number;
  readonly errorText: string;
  readonly field: DistrictImportField;
  readonly rowValue: readonly string[];
}

export interface DistrictsImportApiError {
  readonly error: string;
}

export interface DistrictsImportApiSuccess {
  readonly districtsDefinition: DistrictsDefinition;
  readonly rowFlags?: readonly ImportRowFlag[];
  readonly numFlags?: number;
  readonly maxDistrictId: number;
}

export type DistrictsImportApiResponse = DistrictsImportApiSuccess | DistrictsImportApiError;

export interface PlanScoreAPIResponse {
  readonly index_url: string;
  readonly plan_url: string;
}
