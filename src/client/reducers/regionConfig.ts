import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import {
  ActionTypes,
  regionConfigsFetchFailure,
  regionConfigsFetchSuccess
} from "../actions/regionConfig";

import { IRegionConfig } from "../../shared/entities";
import { fetchRegionConfigs } from "../api";
import { Resource } from "../resource";

export type RegionConfigState = Resource<readonly IRegionConfig[]>;

export const initialState = {
  isPending: false
};

const regionConfigReducer: LoopReducer<RegionConfigState, Action> = (
  state: RegionConfigState = initialState,
  action: Action
): RegionConfigState | Loop<RegionConfigState, Action> => {
  switch (action.type) {
    case ActionTypes.REGION_CONFIGS_FETCH:
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchRegionConfigs, {
          successActionCreator: regionConfigsFetchSuccess,
          failActionCreator: regionConfigsFetchFailure,
          args: []
        })
      );
    case ActionTypes.REGION_CONFIGS_FETCH_SUCCESS:
      return {
        resource: action.regionConfigs
      };
    case ActionTypes.REGION_CONFIGS_FETCH_FAILURE:
      return {
        errorMessage: action.errorMessage
      };
    default:
      return state;
  }
};

export default regionConfigReducer;
