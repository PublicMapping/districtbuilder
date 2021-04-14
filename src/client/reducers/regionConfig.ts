import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  regionConfigsFetch,
  regionConfigsFetchFailure,
  regionConfigsFetchSuccess,
  regionPropertiesFetch,
  regionPropertiesFetchFailure,
  regionPropertiesFetchSuccess
} from "../actions/regionConfig";

import { IRegionConfig, RegionLookupProperties } from "../../shared/entities";
import { fetchRegionConfigs, fetchRegionProperties } from "../api";
import { showResourceFailedToast } from "../functions";
import { Resource } from "../resource";

export interface RegionConfigState {
  readonly regionConfigs: Resource<readonly IRegionConfig[]>;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly currentRegion: string | undefined;
}

export const initialState = {
  regionConfigs: { isPending: false },
  regionProperties: { isPending: false },
  currentRegion: undefined
};

const regionConfigReducer: LoopReducer<RegionConfigState, Action> = (
  state: RegionConfigState = initialState,
  action: Action
): RegionConfigState | Loop<RegionConfigState, Action> => {
  switch (action.type) {
    case getType(regionConfigsFetch):
      return loop(
        {
          ...state,
          regionConfigs: { isPending: true }
        },
        Cmd.run(fetchRegionConfigs, {
          successActionCreator: regionConfigsFetchSuccess,
          failActionCreator: regionConfigsFetchFailure,
          args: [] as Parameters<typeof fetchRegionConfigs>
        })
      );
    case getType(regionConfigsFetchSuccess):
      return {
        ...state,
        regionConfigs: { resource: action.payload }
      };
    case getType(regionConfigsFetchFailure):
      return loop(
        {
          ...state,
          regionConfigs: {
            errorMessage: action.payload
          }
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(regionPropertiesFetch):
      return loop(
        {
          ...state,
          currentRegion: action.payload.regionConfigId,
          regionProperties: { isPending: true }
        },
        Cmd.run(fetchRegionProperties, {
          successActionCreator: regionPropertiesFetchSuccess,
          failActionCreator: regionPropertiesFetchFailure,
          args: [action.payload.regionConfigId, action.payload.geoLevel] as Parameters<
            typeof fetchRegionProperties
          >
        })
      );
    case getType(regionPropertiesFetchSuccess):
      return {
        ...state,
        regionProperties: { resource: action.payload }
      };
    case getType(regionPropertiesFetchFailure):
      return loop(
        {
          ...state,
          regionProperties: {
            errorMessage: action.payload
          }
        },
        Cmd.run(showResourceFailedToast)
      );
    default:
      return state;
  }
};

export default regionConfigReducer;
