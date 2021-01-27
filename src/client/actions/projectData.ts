import { createAction } from "typesafe-actions";
import { ProjectVisibility } from "../../shared/constants";
import { DistrictsDefinition, IProject, LockedDistricts, ProjectId } from "../../shared/entities";
import { DynamicProjectData, StaticProjectData } from "../types";

export const projectFetch = createAction("Project fetch")<ProjectId>();
export const projectFetchSuccess = createAction("Project fetch success")<DynamicProjectData>();
export const projectFetchFailure = createAction("Project fetch failure")<string>();

export const projectDataFetch = createAction("Project data fetch")<ProjectId>();
export const projectDataFetchSuccess = createAction("Project data fetch success")<
  DynamicProjectData
>();
export const projectDataFetchFailure = createAction("Project data fetch failure")<string>();

export const staticDataFetchSuccess = createAction("Static data fetch success")<
  StaticProjectData
>();
export const staticDataFetchFailure = createAction("Static data fetch failure")<string>();

export const setProjectNameEditing = createAction("Toggle editing project name")<boolean>();

export const updateProjectName = createAction("Update project name")<string>();
export const updateProjectNameSuccess = createAction("Update project name success")<
  DynamicProjectData
>();

export const updateProjectVisibility = createAction("Update project visibility")<
  ProjectVisibility
>();
export const updateProjectVisibilitySuccess = createAction("Update project visibility success")<
  DynamicProjectData
>();

export const updateDistrictsDefinition = createAction(
  "Update districts definition"
)<DistrictsDefinition | null>();
export const updateDistrictsDefinitionSuccess = createAction("Update districts definition success")<
  IProject
>();
export const updateDistrictsDefinitionRefetchGeoJsonSuccess = createAction(
  "Update districts definition refetch geojson success"
)<DynamicProjectData>();

export const updateDistrictLocks = createAction("Update district locks")<LockedDistricts>();
export const updateDistrictLocksSuccess = createAction("Update district locks success")<
  DynamicProjectData
>();
export const updateDistrictLocksFailure = createAction("Update district locks failure")<string>();

export const updateProjectFailed = createAction("Update project failure")();

export const exportCsv = createAction("Export project CSV")<IProject>();
export const exportCsvFailure = createAction("Export project CSV failure")<string>();

export const exportGeoJson = createAction("Export project GeoJSON")<IProject>();
export const exportGeoJsonFailure = createAction("Export project GeoJSON failure")<string>();

export const exportShp = createAction("Export project Shapefile")<IProject>();
export const exportShpFailure = createAction("Export project Shapefile failure")<string>();
