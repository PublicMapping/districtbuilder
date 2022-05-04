import { createAction } from "typesafe-actions";
import {
  IRegionConfig,
  RegionConfigId,
  RegionLookupProperties
} from "@districtbuilder/shared/entities";

export const regionConfigsFetch = createAction("Region configs fetch")();
export const regionConfigsFetchSuccess = createAction("Region configs fetch success")<
  readonly IRegionConfig[]
>();
export const regionConfigsFetchFailure = createAction("Region configs fetch failure")<string>();

export const regionPropertiesFetch = createAction("Region properties fetch")<{
  readonly regionConfigId: RegionConfigId;
  readonly geoLevel: string;
}>();
export const regionPropertiesFetchSuccess = createAction("Region properties fetch success")<
  readonly RegionLookupProperties[]
>();
export const regionPropertiesFetchFailure = createAction(
  "Region properties fetch failure"
)<string>();
