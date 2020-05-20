import { createAction } from "typesafe-actions";
import { IStaticMetadata, S3URI } from "../../shared/entities";

export const staticMetadataFetch = createAction("StaticMetadata fetch")<S3URI>();
export const staticMetadataFetchSuccess = createAction("StaticMetadata fetch success")<
  IStaticMetadata
>();
export const staticMetadataFetchFailure = createAction("StaticMetadata fetch failure")<string>();
