import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import * as H from "history";
import {
  IProject,
  IStaticMetadata,
  UintArrays,
  GeoUnitHierarchy,
  DistrictProperties,
  DemographicCounts,
  PaginationMetadata,
  IProject,
  IReferenceLayer,
  ProjectId
} from "../shared/entities";

export type DistrictGeoJSON = Feature<MultiPolygon, DistrictProperties>;
export type DistrictsGeoJSON = FeatureCollection<MultiPolygon, DistrictProperties>;

export interface DynamicProjectData {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly meta: PaginationMetadata;
}

export interface StaticProjectData {
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}

export interface WorkerProjectData {
  readonly staticDemographics: UintArrays;
  readonly staticVotingData?: UintArrays;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}

export interface StaticCounts {
  // nest demographics and voting data together
  readonly demographics: DemographicCounts;
  readonly voting?: DemographicCounts;
}

export type ProjectData = DynamicProjectData & StaticProjectData;

export type SavingState = "unsaved" | "saving" | "saved" | "failed";

export interface AuthLocationState {
  readonly from: H.Location;
}

export type MetricKey =
  | "equalPopulation"
  | "contiguity"
  | "competitiveness"
  | "compactness"
  | "majorityMinority"
  | "countySplits";

export interface BaseEvaluateMetric {
  readonly key: MetricKey;
  readonly name: string;
  readonly description: string;
  readonly longText?: string;
  readonly shortText?: string;
  readonly showInSummary: boolean;
}

export type ElectionYear = "16" | "20" | "combined";

export interface Party {
  readonly color: string;
  readonly label: "D" | "R";
}

export interface PviBucket {
  readonly name: string;
  readonly label: string;
  readonly color: string;
  readonly count?: number;
}

export interface EvaluateMetricWithValue extends BaseEvaluateMetric {
  readonly type: "fraction" | "percent" | "count" | "pvi";
  readonly value?: number;
  readonly total?: number;
  readonly party?: Party;
  readonly hasMultipleElections?: boolean;
  readonly electionYear?: ElectionYear;
  readonly avgPopulation?: number;
  readonly popThreshold?: number;
  readonly status?: boolean;
  // eslint-disable-next-line
  readonly [key: string]: any;
}

export type ChoroplethSteps = readonly (readonly [number, string])[];

export type ReferenceLayerGeojson =
  | FeatureCollection<MultiPolygon, ReferenceLayerProperties>
  | FeatureCollection<Point, ReferenceLayerProperties>;

export interface ReferenceLayerImportResponse {
  readonly geojson?: ReferenceLayerGeojson;
  readonly valid: boolean;
  readonly fields?: readonly string[];
}

export interface CreateReferenceLayerData {
  readonly layer: ReferenceLayerGeojson;
  readonly name: string;
  readonly label_field?: string;
  readonly project: ProjectId;
}

export interface ReferenceLayerWithGeojson extends IReferenceLayer {
  readonly layer: ReferenceLayerGeojson;
}
