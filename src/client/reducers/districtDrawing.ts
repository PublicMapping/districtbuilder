import { Cmd, CmdType, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { SavingState } from "../types";

import {
  addSelectedGeounits,
  clearHighlightedGeounits,
  clearSelectedGeounits,
  editSelectedGeounits,
  redo,
  removeSelectedGeounits,
  setGeoLevelIndex,
  setGeoLevelVisibility,
  setHighlightedGeounits,
  setSelectedDistrictId,
  setSelectionTool,
  setSelectedGeounits,
  showAdvancedEditingModal,
  toggleDistrictLocked,
  undo,
  replaceSelectedGeounits,
  toggleFind,
  setFindIndex,
  saveDistrictsDefinition,
  setSavingState
} from "../actions/districtDrawing";
import { updateDistrictsDefinition } from "../actions/projectData";
import { SelectionTool } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";
import {
  DistrictsDefinition,
  GeoUnits,
  GeoUnitsForLevel,
  LockedDistricts
} from "../../shared/entities";
import { ProjectState, initialProjectState } from "./project";

const UNDO_HISTORY_MAX_LENGTH = 100;

function setGeoUnitsForLevel(
  currentGeoUnits: GeoUnitsForLevel,
  geoUnitsToAdd: GeoUnitsForLevel,
  geoUnitsToDelete: GeoUnitsForLevel
): GeoUnitsForLevel {
  const mutableSelected = new Map([...currentGeoUnits, ...geoUnitsToAdd]);
  geoUnitsToDelete.forEach((_value, key) => {
    mutableSelected.delete(key);
  });
  return mutableSelected;
}

function editGeoUnits(
  currentGeoUnits: GeoUnits,
  geoUnitsToAdd?: GeoUnits,
  geoUnitsToDelete?: GeoUnits
): GeoUnits {
  const allKeys = new Set(
    Object.keys(currentGeoUnits)
      .concat(Object.keys(geoUnitsToAdd || {}))
      .concat(Object.keys(geoUnitsToDelete || {}))
  );
  return [...allKeys].reduce((geoUnits, geoLevelId) => {
    return {
      ...geoUnits,
      [geoLevelId]: setGeoUnitsForLevel(
        currentGeoUnits[geoLevelId] || new Map(),
        (geoUnitsToAdd && geoUnitsToAdd[geoLevelId]) || new Map(),
        (geoUnitsToDelete && geoUnitsToDelete[geoLevelId]) || new Map()
      )
    };
  }, {} as GeoUnits);
}

function clearGeoUnits(geoUnits: GeoUnits): GeoUnits {
  return Object.keys(geoUnits).reduce((geoUnits, geoLevelId) => {
    return {
      ...geoUnits,
      [geoLevelId]: new Map()
    };
  }, {});
}

export function pushState(state: ProjectState, undoState: UndoableStateAndEffect): ProjectState {
  return {
    ...state,
    undoHistory: {
      past: [
        // We want to limit the undo history to the n most recent items, which is why a negative
        // index is used
        ...state.undoHistory.past.slice(UNDO_HISTORY_MAX_LENGTH * -1),
        state.undoHistory.present
      ],
      present: undoState,
      future: []
    }
  };
}

export function replaceState(state: ProjectState, undoState: UndoableStateAndEffect) {
  return {
    ...state,
    undoHistory: {
      ...state.undoHistory,
      present: undoState
    }
  };
}

interface UndoableState {
  readonly selectedGeounits: GeoUnits;
  readonly geoLevelIndex: number; // Index is based off of reversed geoLevelHierarchy in static metadata
  readonly geoLevelVisibility: ReadonlyArray<boolean>; // Visibility values at indices corresponding to `geoLevelIndex`
  readonly lockedDistricts: LockedDistricts;
  readonly districtsDefinition: DistrictsDefinition;
}

interface UndoableStateAndEffect {
  readonly state: UndoableState;
  // Accompanying effect for state update when undone/redone (eg. saving districts definition)
  readonly effect?: CmdType<Action>;
}

export interface UndoHistory {
  readonly past: readonly UndoableStateAndEffect[];
  readonly present: UndoableStateAndEffect;
  readonly future: readonly UndoableStateAndEffect[];
}

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly highlightedGeounits: GeoUnits;
  readonly selectionTool: SelectionTool;
  readonly showAdvancedEditingModal: boolean;
  readonly findMenuOpen: boolean;
  readonly findIndex?: number;
  readonly saving: SavingState;
  readonly undoHistory: UndoHistory;
}

export const initialDistrictDrawingState: DistrictDrawingState = {
  selectedDistrictId: 1,
  highlightedGeounits: {},
  selectionTool: SelectionTool.Default,
  showAdvancedEditingModal: false,
  findMenuOpen: false,
  saving: "unsaved",
  undoHistory: {
    past: [],
    present: {
      state: {
        selectedGeounits: {},
        geoLevelIndex: 0,
        geoLevelVisibility: [],
        lockedDistricts: new Set(),
        districtsDefinition: []
      }
    },
    future: []
  }
};

export function getPresentDrawingState(undoHistory: UndoHistory): UndoableState {
  return "state" in undoHistory.present ? undoHistory.present.state : undoHistory.present;
}

const districtDrawingReducer: LoopReducer<ProjectState, Action> = (
  state: ProjectState = initialProjectState,
  action: Action
): ProjectState | Loop<ProjectState, Action> => {
  const { present } = state.undoHistory;
  const presentState = getPresentDrawingState(state.undoHistory);
  console.log(action, state);
  switch (action.type) {
    case getType(resetProjectState):
      return {
        ...state,
        ...initialDistrictDrawingState
      };
    case getType(setSelectedDistrictId):
      return {
        ...state,
        selectedDistrictId: action.payload
      };
    case getType(addSelectedGeounits):
      return loop(
        state,
        Cmd.action(
          editSelectedGeounits({
            add: action.payload
          })
        )
      );
    case getType(removeSelectedGeounits):
      return loop(
        state,
        Cmd.action(
          editSelectedGeounits({
            remove: action.payload
          })
        )
      );
    // Note the only difference between this and replaceSelectedGeounits is whether we use pushState or replaceState
    case getType(editSelectedGeounits):
      return pushState(state, {
        state: {
          ...presentState,
          selectedGeounits: editGeoUnits(
            presentState.selectedGeounits,
            action.payload.add,
            action.payload.remove
          )
        }
      });
    case getType(replaceSelectedGeounits):
      return replaceState(state, {
        state: {
          ...presentState,
          selectedGeounits: editGeoUnits(
            presentState.selectedGeounits,
            action.payload.add,
            action.payload.remove
          )
        }
      });
    case getType(setSelectedGeounits):
      return pushState(state, {
        state: {
          ...presentState,
          selectedGeounits: action.payload
        }
      });
    case getType(clearSelectedGeounits): {
      const clearedViaCancel = action.payload;
      const func = clearedViaCancel ? pushState : replaceState;
      return loop(
        func(state, {
          ...present,
          state: {
            ...presentState,
            selectedGeounits: clearGeoUnits(presentState.selectedGeounits)
          }
        }),
        Cmd.action(setSavingState(clearedViaCancel ? "unsaved" : "saved"))
      );
    }
    case getType(setSavingState):
      return {
        ...state,
        saving: action.payload
      };
    case getType(setHighlightedGeounits):
      return {
        ...state,
        highlightedGeounits: action.payload
      };
    case getType(clearHighlightedGeounits):
      return {
        ...state,
        highlightedGeounits: clearGeoUnits(state.highlightedGeounits)
      };
    case getType(setSelectionTool):
      return {
        ...state,
        selectionTool: action.payload
      };
    case getType(setGeoLevelIndex):
      return replaceState(state, {
        state: {
          ...presentState,
          geoLevelIndex: action.payload
        }
      });
    case getType(setGeoLevelVisibility):
      return replaceState(state, {
        state: {
          ...presentState,
          geoLevelVisibility: action.payload
        }
      });
    case getType(toggleDistrictLocked):
      return pushState(state, {
        state: {
          ...presentState,
          lockedDistricts: new Set(
            presentState.lockedDistricts.has(action.payload)
              ? [...presentState.lockedDistricts.values()].filter(
                  districtId => districtId !== action.payload
                )
              : [...presentState.lockedDistricts.values(), action.payload]
          )
        }
      });
    case getType(showAdvancedEditingModal):
      return {
        ...state,
        showAdvancedEditingModal: action.payload
      };
    case getType(toggleFind):
      return {
        ...state,
        findMenuOpen: action.payload,
        findIndex: undefined
      };
    case getType(setFindIndex):
      return {
        ...state,
        findIndex: action.payload
      };
    case getType(undo): {
      const projectData =
        state.undoHistory.past.length === 1 && state.previousProjectData
          ? { projectData: state.previousProjectData }
          : {};
      const lastPastState = state.undoHistory.past[state.undoHistory.past.length - 1];
      return state.undoHistory.past.length === 0
        ? state
        : loop(
            {
              ...state,
              ...projectData,
              undoHistory: {
                past: state.undoHistory.past.slice(0, -1),
                present: lastPastState,
                future: [present, ...state.undoHistory.future]
              }
            },
            present.effect || Cmd.none
          );
    }
    case getType(redo): {
      const projectData =
        state.undoHistory.past.length === 0 && state.currentProjectData
          ? { projectData: state.currentProjectData }
          : {};
      const nextFutureState = state.undoHistory.future[0];
      return state.undoHistory.future.length === 0
        ? state
        : loop(
            {
              ...state,
              ...projectData,
              undoHistory: {
                past: [...state.undoHistory.past, present],
                present: nextFutureState,
                future: state.undoHistory.future.slice(1)
              }
            },
            present.effect || Cmd.none
          );
    }
    case getType(saveDistrictsDefinition):
      return loop(
        pushState(state, {
          ...present,
          effect: Cmd.action(updateDistrictsDefinition(present.state.districtsDefinition))
        }),
        Cmd.action(updateDistrictsDefinition(null))
      );
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
