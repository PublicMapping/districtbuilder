import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  addSelectedGeounitIds,
  clearSelectedGeounitIds,
  patchDistrictsDefinitionSuccess,
  patchDistrictsDefinitionFailure,
  removeSelectedGeounitIds,
  saveDistrictsDefinition,
  setSelectedDistrictId
} from "../actions/districtDrawing";
import { projectFetchGeoJson } from "../actions/projectData";

import { patchDistrictsDefinition } from "../api";

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly selectedGeounitIds: ReadonlySet<number>;
}

export const initialState = {
  selectedDistrictId: 1,
  selectedGeounitIds: new Set([])
};

const districtDrawingReducer: LoopReducer<DistrictDrawingState, Action> = (
  state: DistrictDrawingState = initialState,
  action: Action
): DistrictDrawingState | Loop<DistrictDrawingState, Action> => {
  switch (action.type) {
    case getType(setSelectedDistrictId):
      return {
        ...state,
        selectedDistrictId: action.payload
      };
    case getType(addSelectedGeounitIds):
      return {
        ...state,
        selectedGeounitIds: new Set([...state.selectedGeounitIds, ...action.payload])
      };
    case getType(removeSelectedGeounitIds): {
      const mutableSelected = new Set([...state.selectedGeounitIds]);
      [...action.payload].forEach(function(v) {
        mutableSelected.delete(v);
      });
      return {
        ...state,
        selectedGeounitIds: mutableSelected
      };
    }
    case getType(clearSelectedGeounitIds):
      return {
        ...state,
        selectedGeounitIds: new Set([])
      };
    case getType(saveDistrictsDefinition):
      return loop(
        state,
        Cmd.run(patchDistrictsDefinition, {
          successActionCreator: patchDistrictsDefinitionSuccess,
          failActionCreator: patchDistrictsDefinitionFailure,
          args: [
            action.payload.id,
            // TODO (#113): we are only dealing with the top-most geolevel at the moment, so this
            // will need to be modified when we support all geolevels.
            [...state.selectedGeounitIds].reduce((newDistrictsDefinition, geounitId) => {
              // @ts-ignore
              // eslint-disable-next-line
              newDistrictsDefinition[geounitId] = state.selectedDistrictId;
              return newDistrictsDefinition;
            }, action.payload.districtsDefinition)
          ] as Parameters<typeof patchDistrictsDefinition>
        })
      );
    case getType(patchDistrictsDefinitionSuccess):
      return loop(
        {
          ...state,
          project: { resource: action.payload }
        },
        Cmd.action(projectFetchGeoJson(action.payload.id))
      );
    case getType(patchDistrictsDefinitionFailure):
      // TODO (#188): implement a status area to display errors for this and other things
      // eslint-disable-next-line
      console.log("Error patching districts definition: ", action.payload);
      return state;

    default:
      return state as never;
  }
};

export default districtDrawingReducer;
