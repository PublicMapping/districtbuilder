import { Loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { ElectionYear } from "../types";

import {
  toggleLimitDrawingToWithinCounty,
  setElectionYear,
  setPopulationKey
} from "../actions/projectOptions";
import { resetProjectState } from "../actions/root";
import { GroupTotal } from "../../shared/entities";

export interface ProjectOptionsState {
  readonly limitSelectionToCounty: boolean;
  readonly electionYear: ElectionYear;
  readonly populationKey: GroupTotal;
}

export const initialProjectOptionsState: ProjectOptionsState = {
  limitSelectionToCounty: false,
  electionYear: "16",
  populationKey: "population"
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
    case getType(setPopulationKey):
      return {
        ...state,
        populationKey: action.payload
      };
    default:
      return state as never;
  }
};

export default projectOptionsReducer;
