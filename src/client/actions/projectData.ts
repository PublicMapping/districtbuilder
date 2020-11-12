import { createAction } from "typesafe-actions";
import { IProject, ProjectId } from "../../shared/entities";
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

export const updateDistrictsDefinition = createAction("Update districts definition")();
export const updateDistrictsDefinitionSuccess = createAction("Update districts definition success")<
  IProject
>();
export const updateDistrictsDefinitionRefetchGeoJsonSuccess = createAction(
  "Update districts definition refetch geojson success"
)<DynamicProjectData>();

export const updateProjectFailed = createAction("Update project failure")();

export const downloadCsv = createAction("Download project CSV")<ProjectId>();
export const downloadCsvFailure = createAction("Download project CSV failure")<string>();
