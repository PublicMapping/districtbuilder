import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { SavingState, EvaluateMetricWithValue, ElectionYear } from "../types";

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
  setHoveredDistrictId,
  setSelectionTool,
  showAdvancedEditingModal,
  showCopyMapModal,
  showConvertMapModal,
  setImportFlagsModal,
  toggleDistrictLocked,
  undo,
  replaceSelectedGeounits,
  toggleFind,
  toggleEvaluate,
  setFindIndex,
  setFindType,
  saveDistrictsDefinition,
  setSavingState,
  FindTool,
  toggleLimitDrawingToWithinCounty,
  selectEvaluationMetric,
  setZoomToDistrictId,
  setMapLabel,
  toggleKeyboardShortcutsModal,
  setElectionYear,
  PaintBrushSize,
  setPaintBrushSize,
  toggleExpandedMetrics
} from "../actions/districtDrawing";
import { updateDistrictsDefinition, updateDistrictLocks } from "../actions/projectData";
import { SelectionTool } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";
import { DistrictId, GeoUnits, GeoUnitsForLevel, LockedDistricts } from "../../shared/entities";
import { ProjectState, initialProjectState } from "./project";
import {
  pushEffect,
  pushStateUpdate,
  UndoHistory,
  UndoableState,
  updateCurrentState
} from "./undoRedo";
import { canSwitchGeoLevels, isBaseGeoLevelAlwaysVisible } from "../functions";

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

function toggleLock(id: DistrictId, locks: LockedDistricts): LockedDistricts {
  return locks
    .slice(0, id)
    .concat(!locks[id])
    .concat(...locks.slice(id + 1));
}

export interface DistrictDrawingState {
  readonly selectedDistrictId: number;
  readonly hoveredDistrictId: number | null;
  readonly zoomToDistrictId: number | null;
  readonly highlightedGeounits: GeoUnits;
  readonly selectionTool: SelectionTool;
  readonly paintBrushSize: PaintBrushSize;
  readonly showAdvancedEditingModal: boolean;
  readonly showCopyMapModal: boolean;
  readonly showConvertMapModal: boolean;
  readonly showKeyboardShortcutsModal: boolean;
  readonly showImportFlagsModal: boolean;
  readonly findMenuOpen: boolean;
  readonly expandedProjectMetrics: boolean;
  readonly evaluateMode: boolean;
  readonly evaluateMetric: EvaluateMetricWithValue | undefined;
  readonly findIndex?: number;
  readonly findTool: FindTool;
  readonly limitSelectionToCounty: boolean;
  readonly electionYear: ElectionYear;
  readonly saving: SavingState;
  readonly undoHistory: UndoHistory;
  readonly mapLabel: string | undefined;
}

export const initialDistrictDrawingState: DistrictDrawingState = {
  selectedDistrictId: 1,
  hoveredDistrictId: null,
  zoomToDistrictId: null,
  highlightedGeounits: {},
  selectionTool: SelectionTool.Default,
  paintBrushSize: 1,
  showAdvancedEditingModal: false,
  showCopyMapModal: false,
  showConvertMapModal: false,
  showImportFlagsModal: false,
  showKeyboardShortcutsModal: false,
  findMenuOpen: false,
  expandedProjectMetrics: false,
  evaluateMode: false,
  evaluateMetric: undefined,
  findTool: FindTool.Unassigned,
  limitSelectionToCounty: false,
  electionYear: "16",
  saving: "unsaved",
  mapLabel: "undefined",
  undoHistory: {
    past: [],
    present: {
      state: {
        selectedGeounits: {},
        geoLevelIndex: 0,
        geoLevelVisibility: [],
        lockedDistricts: [],
        districtsDefinition: []
      }
    },
    future: []
  }
};

const districtDrawingReducer: LoopReducer<ProjectState, Action> = (
  state: ProjectState = initialProjectState,
  action: Action
): ProjectState | Loop<ProjectState, Action> => {
  const { present } = state.undoHistory;
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
    case getType(setHoveredDistrictId):
      return {
        ...state,
        hoveredDistrictId: action.payload
      };
    case getType(setZoomToDistrictId):
      return {
        ...state,
        zoomToDistrictId: action.payload
      };
    case getType(setMapLabel):
      return {
        ...state,
        mapLabel: action.payload
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
    // Note the only difference between this and replaceSelectedGeounits is whether we use pushStateUpdate or updateState
    case getType(editSelectedGeounits):
      return pushStateUpdate(state, {
        selectedGeounits: editGeoUnits(
          present.state.selectedGeounits,
          action.payload.add,
          action.payload.remove
        )
      });
    case getType(replaceSelectedGeounits):
      return updateCurrentState(state, {
        selectedGeounits: editGeoUnits(
          present.state.selectedGeounits,
          action.payload.add,
          action.payload.remove
        )
      });
    case getType(clearSelectedGeounits): {
      const clearedViaCancel = action.payload;
      const func = clearedViaCancel ? pushStateUpdate : updateCurrentState;
      return loop(
        func(state, {
          selectedGeounits: clearGeoUnits(present.state.selectedGeounits)
        }),
        Cmd.action(setSavingState(clearedViaCancel ? "unsaved" : "saved"))
      );
    }
    case getType(setSavingState):
      return {
        ...state,
        saving: action.payload
      };
    case getType(toggleLimitDrawingToWithinCounty):
      return {
        ...state,
        limitSelectionToCounty: !state.limitSelectionToCounty
      };
    case getType(setElectionYear):
      return {
        ...state,
        electionYear: action.payload
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
    case getType(setPaintBrushSize):
      return {
        ...state,
        paintBrushSize: action.payload
      };
    case getType(setGeoLevelIndex): {
      if ("resource" in state.staticData && "resource" in state.projectData) {
        const { index, isReadOnly, skipModal } = action.payload;
        const { geoLevelHierarchy } = state.staticData.resource.staticMetadata;
        const { advancedEditingEnabled } = state.projectData.resource.project;
        const isBaseLevelAlwaysVisible = isBaseGeoLevelAlwaysVisible(geoLevelHierarchy);
        const canSwitch = canSwitchGeoLevels(
          state.undoHistory.present.state.geoLevelIndex,
          index,
          geoLevelHierarchy,
          state.undoHistory.present.state.selectedGeounits
        );

        return !canSwitch
          ? loop(state, Cmd.none)
          : !advancedEditingEnabled &&
            !skipModal &&
            !isReadOnly &&
            !isBaseLevelAlwaysVisible &&
            index === geoLevelHierarchy.length - 1
          ? loop(state, Cmd.action(showAdvancedEditingModal(true)))
          : updateCurrentState(state, {
              geoLevelIndex: index
            });
      }
      return state;
    }
    case getType(setGeoLevelVisibility):
      return updateCurrentState(state, {
        geoLevelVisibility: action.payload
      });
    case getType(toggleDistrictLocked):
      return loop(
        // Save an effect function which takes the district locks so that we can
        // undo/redo saving of the locks with the correct state snapshot.
        pushEffect(state, (state: UndoableState) => {
          return Cmd.action(updateDistrictLocks(state.lockedDistricts));
        }),
        Cmd.action(
          updateDistrictLocks(
            toggleLock(action.payload, state.undoHistory.present.state.lockedDistricts)
          )
        )
      );
    case getType(showAdvancedEditingModal):
      return {
        ...state,
        showAdvancedEditingModal: action.payload
      };
    case getType(toggleKeyboardShortcutsModal):
      return {
        ...state,
        showKeyboardShortcutsModal: !state.showKeyboardShortcutsModal
      };
    case getType(showCopyMapModal):
      return {
        ...state,
        showCopyMapModal: action.payload
      };
    case getType(showConvertMapModal):
      return {
        ...state,
        showConvertMapModal: action.payload
      };
    case getType(setImportFlagsModal):
      return {
        ...state,
        showImportFlagsModal: action.payload
      };
    case getType(toggleFind):
      return {
        ...state,
        findMenuOpen: action.payload,
        findIndex: undefined
      };
    case getType(toggleEvaluate):
      return {
        ...state,
        evaluateMode: action.payload
      };
    case getType(toggleExpandedMetrics):
      return {
        ...state,
        expandedProjectMetrics: action.payload
      };
    case getType(selectEvaluationMetric):
      return {
        ...state,
        evaluateMetric: action.payload
      };
    case getType(setFindIndex):
      return {
        ...state,
        findIndex: action.payload
      };
    case getType(setFindType):
      return {
        ...state,
        findTool: action.payload
      };
    case getType(undo): {
      const lastPastState = state.undoHistory.past[state.undoHistory.past.length - 1];
      return state.undoHistory.past.length === 0
        ? state
        : loop(
            {
              ...state,
              undoHistory: {
                past: state.undoHistory.past.slice(0, -1),
                present: lastPastState,
                future: [present, ...state.undoHistory.future]
              }
            },
            present.effect ? present.effect(lastPastState.state) : Cmd.none
          );
    }
    case getType(redo): {
      const nextFutureState = state.undoHistory.future[0];
      return state.undoHistory.future.length === 0
        ? state
        : loop(
            {
              ...state,
              undoHistory: {
                past: [...state.undoHistory.past, present],
                present: nextFutureState,
                future: state.undoHistory.future.slice(1)
              }
            },
            nextFutureState.effect ? nextFutureState.effect(nextFutureState.state) : Cmd.none
          );
    }
    case getType(saveDistrictsDefinition):
      return loop(
        // Save an effect function which takes the appropriate districts definition so that we can
        // undo/redo saving of the districts definition with the correct state snapshot.
        pushEffect(state, (state: UndoableState) =>
          Cmd.action(updateDistrictsDefinition(state.districtsDefinition))
        ),
        Cmd.action(updateDistrictsDefinition(null))
      );
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
