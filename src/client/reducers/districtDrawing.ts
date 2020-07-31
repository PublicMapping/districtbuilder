import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  addSelectedGeounitIds,
  clearSelectedGeounitIds,
  removeSelectedGeounitIds,
  SelectionTool,
  saveDistrictsDefinition,
  setSelectionTool,
  setSelectedDistrictId,
  setGeoLevelIndex,
  setGeoLevelVisibility,
  toggleDistrictLocked
} from "../actions/districtDrawing";
import { updateDistrictsDefinition } from "../actions/projectData";
import { DistrictId, GeoUnits } from "../../shared/entities";

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number; // Index is based off of reversed geoLevelHierarchy in static metadata
  readonly geoLevelVisibility: ReadonlyArray<boolean>; // Visibility values at indices corresponding to `geoLevelIndex`
  readonly lockedDistricts: ReadonlySet<DistrictId>;
}

export const initialState: DistrictDrawingState = {
  selectedDistrictId: 1,
  selectedGeounits: new Map(),
  selectionTool: SelectionTool.Default,
  geoLevelIndex: 0,
  geoLevelVisibility: [],
  lockedDistricts: new Set()
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
    case getType(setSelectionTool):
      return {
        ...state,
        selectionTool: action.payload
      };
    case getType(setGeoLevelIndex):
      return loop(
        {
          ...state,
          geoLevelIndex: action.payload
        },
        state.selectedGeounits.size > 0 ? Cmd.action(saveDistrictsDefinition()) : Cmd.none
      );
    case getType(saveDistrictsDefinition):
      return loop(
        state,
        Cmd.action(
          updateDistrictsDefinition({
            selectedGeounits: state.selectedGeounits,
            selectedDistrictId: state.selectedDistrictId
          })
        )
      );
    case getType(setGeoLevelVisibility):
      return {
        ...state,
        geoLevelVisibility: action.payload
      };
    case getType(toggleDistrictLocked):
      return {
        ...state,
        lockedDistricts: new Set(
          state.lockedDistricts.has(action.payload)
            ? [...state.lockedDistricts.values()].filter(
                districtId => districtId !== action.payload
              )
            : [...state.lockedDistricts.values(), action.payload]
        )
      };
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
