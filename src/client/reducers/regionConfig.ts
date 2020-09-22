import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  regionConfigsFetch,
  regionConfigsFetchFailure,
  regionConfigsFetchSuccess
} from "../actions/regionConfig";

import { IRegionConfig } from "../../shared/entities";
import { fetchRegionConfigs } from "../api";
import { showResourceFailedToast } from "../functions";
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
    case getType(regionConfigsFetch):
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchRegionConfigs, {
          successActionCreator: regionConfigsFetchSuccess,
          failActionCreator: regionConfigsFetchFailure,
          args: [] as Parameters<typeof fetchRegionConfigs>
        })
      );
    case getType(regionConfigsFetchSuccess):
      return {
        resource: action.payload
      };
    case getType(regionConfigsFetchFailure):
      return loop(
        {
          errorMessage: action.payload
        },
        Cmd.run(showResourceFailedToast)
      );
    default:
      return state;
  }
};

export default regionConfigReducer;
