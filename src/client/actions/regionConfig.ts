import { IRegionConfig } from "../../shared/entities";

export enum ActionTypes {
  REGION_CONFIGS_FETCH = "REGION_CONFIG_FETCH",
  REGION_CONFIGS_FETCH_SUCCESS = "REGION_CONFIG_FETCH_SUCCESS",
  REGION_CONFIGS_FETCH_FAILURE = "REGION_CONFIG_FETCH_FAILURE"
}

export type RegionConfigAction =
  | { readonly type: ActionTypes.REGION_CONFIGS_FETCH }
  | {
      readonly type: ActionTypes.REGION_CONFIGS_FETCH_SUCCESS;
      readonly regionConfigs: readonly IRegionConfig[];
    }
  | { readonly type: ActionTypes.REGION_CONFIGS_FETCH_FAILURE; readonly errorMessage: string };

export function regionConfigsFetch(): RegionConfigAction {
  return {
    type: ActionTypes.REGION_CONFIGS_FETCH
  };
}

export function regionConfigsFetchSuccess(
  regionConfigs: readonly IRegionConfig[]
): RegionConfigAction {
  return {
    type: ActionTypes.REGION_CONFIGS_FETCH_SUCCESS,
    regionConfigs
  };
}

export function regionConfigsFetchFailure(errorMessage: string): RegionConfigAction {
  return {
    type: ActionTypes.REGION_CONFIGS_FETCH_FAILURE,
    errorMessage
  };
}
