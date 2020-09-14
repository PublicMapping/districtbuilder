import { createAction } from "typesafe-actions";
import { IRegionConfig } from "../../shared/entities";

export const regionConfigsFetch = createAction("Region configs fetch")();
export const regionConfigsFetchSuccess = createAction("Region configs fetch success")<
  readonly IRegionConfig[]
>();
export const regionConfigsFetchFailure = createAction("Region configs fetch failure")<string>();
