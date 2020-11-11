import { CmdType } from "redux-loop";

import { Action } from "../actions";
import { DistrictsDefinition, GeoUnits, LockedDistricts } from "../../shared/entities";
import { ProjectState } from "./project";

const UNDO_HISTORY_MAX_LENGTH = 100;

export interface UndoableState {
  readonly selectedGeounits: GeoUnits;
  readonly geoLevelIndex: number; // Index is based off of reversed geoLevelHierarchy in static metadata
  readonly geoLevelVisibility: ReadonlyArray<boolean>; // Visibility values at indices corresponding to `geoLevelIndex`
  readonly lockedDistricts: LockedDistricts;
  readonly districtsDefinition: DistrictsDefinition;
}

// Accompanying effect builder for state update when undone/redone (eg. saving districts definition)
export type Effect = (state: UndoableState) => CmdType<Action>;

export interface UndoableStateAndEffect {
  readonly state: UndoableState;
  readonly effect?: Effect;
}

export interface UndoHistory {
  readonly past: readonly UndoableStateAndEffect[];
  readonly present: UndoableStateAndEffect;
  readonly future: readonly UndoableStateAndEffect[];
}

function truncatePastUndoHistory(past: readonly UndoableStateAndEffect[]) {
  // Limit the undo history to the n most recent items
  return past.slice((UNDO_HISTORY_MAX_LENGTH - 1) * -1);
}

export function pushStateUpdate(
  state: ProjectState,
  undoState: Partial<UndoableState>
): ProjectState {
  return {
    ...state,
    undoHistory: {
      past: [...truncatePastUndoHistory(state.undoHistory.past), state.undoHistory.present],
      present: {
        state: {
          ...state.undoHistory.present.state,
          ...undoState
        }
      },
      future: []
    }
  };
}

export function pushEffect(state: ProjectState, effect: Effect): ProjectState {
  return {
    ...state,
    undoHistory: {
      past: [...truncatePastUndoHistory(state.undoHistory.past), state.undoHistory.present],
      present: {
        ...state.undoHistory.present,
        effect
      },
      future: []
    }
  };
}

export function updateCurrentState(state: ProjectState, undoState: Partial<UndoableState>) {
  return {
    ...state,
    undoHistory: {
      ...state.undoHistory,
      present: {
        ...state.undoHistory.present,
        state: {
          ...state.undoHistory.present.state,
          ...undoState
        }
      }
    }
  };
}
