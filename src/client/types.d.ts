import { FeatureCollection, MultiPolygon } from "geojson";
import {
  IProject,
  IStaticMetadata,
  UintArrays,
  GeoUnitHierarchy,
  DistrictProperties
} from "../shared/entities";

export type DistrictGeoJSON = Feature<MultiPolygon, DistrictProperties>;
export type DistrictsGeoJSON = FeatureCollection<MultiPolygon, DistrictProperties>;

export interface DynamicProjectData {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
}

export interface StaticProjectData {
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}

export interface WorkerProjectData {
  readonly staticDemographics: UintArrays;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}

export type ProjectData = DynamicProjectData & StaticProjectData;

export type SavingState = "unsaved" | "saving" | "saved" | "failed";
