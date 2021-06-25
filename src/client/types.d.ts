import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import * as H from "history";
import {
  IProject,
  IStaticMetadata,
  UintArrays,
  GeoUnitHierarchy,
  DistrictProperties,
  DemographicCounts,
  IProject
} from "../shared/entities";

export type DistrictGeoJSON = Feature<MultiPolygon, DistrictProperties>;
export type DistrictsGeoJSON = FeatureCollection<MultiPolygon, DistrictProperties>;

export interface DynamicProjectData {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly meta: {
    readonly currentPage: number;
    readonly itemCount: number;
    readonly itemsPerPage: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
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
}

export type ElectionYear = "16" | "20" | "combined";

export interface Party {
  readonly color: string;
  readonly label: "D" | "R";
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

export type EvaluateMetric = BaseEvaluateMetric | EvaluateMetricWithValue;

export type ChoroplethSteps = readonly (readonly [number, string])[];
