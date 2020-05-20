import { createAction } from "typesafe-actions";
import { IProject, IStaticMetadata, ProjectId, S3URI } from "../../shared/entities";

export const projectDataFetch = createAction("Project data fetch")<ProjectId>();

export const projectFetch = createAction("Project fetch")<ProjectId>();
export const projectFetchSuccess = createAction("Project fetch success")<IProject>();
export const projectFetchFailure = createAction("Project fetch failure")<string>();

export const staticMetadataFetch = createAction("StaticMetadata fetch")<S3URI>();
export const staticMetadataFetchSuccess = createAction("StaticMetadata fetch success")<
  IStaticMetadata
>();
export const staticMetadataFetchFailure = createAction("StaticMetadata fetch failure")<string>();
