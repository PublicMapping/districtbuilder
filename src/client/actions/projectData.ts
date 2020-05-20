import { createAction } from "typesafe-actions";
import { IProject, IStaticFile, IStaticMetadata, ProjectId, S3URI } from "../../shared/entities";

export const projectDataFetch = createAction("Project data fetch")<ProjectId>();

export const projectFetch = createAction("Project fetch")<ProjectId>();
export const projectFetchSuccess = createAction("Project fetch success")<IProject>();
export const projectFetchFailure = createAction("Project fetch failure")<string>();

export const staticMetadataFetch = createAction("Static metadata fetch")<S3URI>();
export const staticMetadataFetchSuccess = createAction("Static metadata fetch success")<
  IStaticMetadata
>();
export const staticMetadataFetchFailure = createAction("Static metadata fetch failure")<string>();

export const staticGeoLevelsFetch = createAction("Static geoLevels fetch")<{
  readonly s3URI: S3URI;
  readonly geoLevels: readonly IStaticFile[];
}>();
export const staticGeoLevelsFetchSuccess = createAction("Static geoLevels fetch success")<
  ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
>();
export const staticGeoLevelsFetchFailure = createAction("Static geoLevels fetch failure")<string>();
