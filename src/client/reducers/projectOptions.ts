import { Loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { ElectionYear } from "../types";

import { toggleLimitDrawingToWithinCounty, setElectionYear } from "../actions/projectOptions";
import { resetProjectState } from "../actions/root";

export interface ProjectOptionsState {
  readonly limitSelectionToCounty: boolean;
  readonly electionYear: ElectionYear;
}

export const initialProjectOptionsState: ProjectOptionsState = {
  limitSelectionToCounty: false,
  electionYear: "16"
};

const projectOptionsReducer: LoopReducer<ProjectOptionsState, Action> = (
  state: ProjectOptionsState = initialProjectOptionsState,
  action: Action
): ProjectOptionsState | Loop<ProjectOptionsState, Action> => {
  switch (action.type) {
    case getType(resetProjectState):
      return {
        ...state,
        ...initialProjectOptionsState
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
    default:
      return state as never;
  }
};

export default projectOptionsReducer;
