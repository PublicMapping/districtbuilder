import { createAction } from "typesafe-actions";
import { FeatureCollection, MultiPolygon } from "geojson";
import {
  UintArrays,
  DistrictProperties,
  GeoUnitHierarchy,
  GeoUnits,
  IProject,
  IStaticMetadata,
  ProjectId,
  S3URI
} from "../../shared/entities";
import { DynamicProjectData, StaticProjectData } from "../types";

export const projectDataFetch = createAction("Project data fetch")<ProjectId>();
export const projectDataFetchSuccess = createAction("Project data fetch success")<
  DynamicProjectData
>();
export const projectDataFetchFailure = createAction("Project data fetch failure")<string>();

export const staticDataFetchSuccess = createAction("Static data fetch success")<
  StaticProjectData
>();
export const staticDataFetchFailure = createAction("Static data fetch failure")<string>();

export const updateDistrictsDefinition = createAction("Update districts definition")<{
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
}>();

export const updateDistrictsDefinitionSuccess = createAction("Update districts definition success")<
  DynamicProjectData
>();
export const updateDistrictsDefinitionFailure = createAction("Update districts definition failure")<
  string
>();
