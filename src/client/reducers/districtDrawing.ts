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
  setGeoLevelIndex
} from "../actions/districtDrawing";
import { projectFetchGeoJson } from "../actions/projectData";
import { assignGeounitsToDistrict } from "../../shared/functions";
import { GeoUnitIndices } from "../../shared/entities";
import { UniqueObjectsSet } from "../../shared";

import { patchDistrictsDefinition } from "../api";

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly selectedGeounits: ReadonlySet<GeoUnitIndices>;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number; // Index is based off of reversed geoLevelHierarchy in static metadata
}

export const initialState = {
  selectedDistrictId: 1,
  selectedGeounits: new UniqueObjectsSet([]),
  selectionTool: SelectionTool.Default,
  geoLevelIndex: 0
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
        selectedGeounits: new UniqueObjectsSet([...state.selectedGeounits, ...action.payload])
      };
    case getType(removeSelectedGeounitIds): {
      const objectsToDelete = [...action.payload].map(d => JSON.stringify(d));
      return {
        ...state,
        selectedGeounits: new UniqueObjectsSet(
          [...state.selectedGeounits].filter(g => !objectsToDelete.includes(JSON.stringify(g)))
        )
      };
    }
    case getType(clearSelectedGeounitIds):
      return {
        ...state,
        selectedGeounits: new UniqueObjectsSet([])
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
              state.selectedGeounits,
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
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
