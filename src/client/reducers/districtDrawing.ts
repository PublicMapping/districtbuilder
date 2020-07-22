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
  SelectionTool,
  setSelectionTool,
  setSelectedDistrictId,
  setGeoLevelIndex,
  setBaseGeoUnitVisible
} from "../actions/districtDrawing";
import { projectFetchGeoJson } from "../actions/projectData";
import { assignGeounitsToDistrict } from "../../shared/functions";
import { GeoUnits } from "../../shared/entities";

import { patchDistrictsDefinition } from "../api";

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number; // Index is based off of reversed geoLevelHierarchy in static metadata
  readonly isBaseGeoUnitVisible: boolean;
}

export const initialState = {
  selectedDistrictId: 1,
  selectedGeounits: new Map(),
  selectionTool: SelectionTool.Default,
  geoLevelIndex: 0,
  isBaseGeoUnitVisible: false
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
        selectedGeounits: new Map([...state.selectedGeounits, ...action.payload])
      };
    case getType(removeSelectedGeounitIds): {
      const mutableSelected = new Map(state.selectedGeounits);
      action.payload.forEach((_value, key) => {
        mutableSelected.delete(key);
      });
      return {
        ...state,
        selectedGeounits: mutableSelected
      };
    }
    case getType(clearSelectedGeounitIds):
      return {
        ...state,
        selectedGeounits: new Map()
      };
    case getType(saveDistrictsDefinition):
      return loop(
        state,
        Cmd.run(patchDistrictsDefinition, {
          successActionCreator: patchDistrictsDefinitionSuccess,
          failActionCreator: patchDistrictsDefinitionFailure,
          args: [
            action.payload.project.id,
            assignGeounitsToDistrict(
              action.payload.project.districtsDefinition,
              action.payload.geoUnitHierarchy,
              Array.from(state.selectedGeounits.values()),
              state.selectedDistrictId
            )
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
    case getType(setSelectionTool):
      return {
        ...state,
        selectionTool: action.payload
      };
    case getType(setGeoLevelIndex):
      return {
        ...state,
        geoLevelIndex: action.payload
      };
    case getType(setBaseGeoUnitVisible):
      return {
        ...state,
        isBaseGeoUnitVisible: action.payload
      };
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
