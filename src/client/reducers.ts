import { combineReducers } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "./actions";
import { resetState } from "./actions/root";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import projectsReducer, {
  initialState as initialProjectsState,
  ProjectsState
} from "./reducers/projects";
import regionConfigReducer, {
  initialState as initialRegionConfigState,
  RegionConfigState
} from "./reducers/regionConfig";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";
import projectReducer, { ProjectState, initialProjectState } from "./reducers/project";

export interface State {
  readonly auth: AuthState;
  readonly user: UserState;
  readonly regionConfig: RegionConfigState;
  readonly projects: ProjectsState;
  readonly project: ProjectState;
}

export const initialState: State = {
  auth: initialAuthState,
  user: initialUserState,
  regionConfig: initialRegionConfigState,
  projects: initialProjectsState,
  project: initialProjectState
};

const allReducers = combineReducers({
  auth: authReducer,
  user: userReducer,
  regionConfig: regionConfigReducer,
  projects: projectsReducer,
  project: projectReducer
});

export default (state = initialState, action: Action) => {
  const newState: State | undefined =
    action && action.type === getType(resetState) ? undefined : state;
  return allReducers(newState, action);
};
