import { combineReducers } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "./actions";
import { resetState } from "./actions/root";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import districtDrawingReducer, {
  initialState as initialDistrictDrawingState,
  DistrictDrawingState
} from "./reducers/districtDrawing";
import projectDataReducer, {
  initialState as initialProjectDataState,
  ProjectDataState
} from "./reducers/projectData";
import projectsReducer, {
  initialState as initialProjectsState,
  ProjectsState
} from "./reducers/projects";
import regionConfigReducer, {
  initialState as initialRegionConfigState,
  RegionConfigState
} from "./reducers/regionConfig";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";

export interface State {
  readonly auth: AuthState;
  readonly user: UserState;
  readonly regionConfig: RegionConfigState;
  readonly projectData: ProjectDataState;
  readonly projects: ProjectsState;
  readonly districtDrawing: DistrictDrawingState;
}

export const initialState: State = {
  auth: initialAuthState,
  user: initialUserState,
  regionConfig: initialRegionConfigState,
  projectData: initialProjectDataState,
  projects: initialProjectsState,
  districtDrawing: initialDistrictDrawingState
};

const allReducers = combineReducers({
  auth: authReducer,
  user: userReducer,
  regionConfig: regionConfigReducer,
  projectData: projectDataReducer,
  projects: projectsReducer,
  districtDrawing: districtDrawingReducer
});

export default (state = initialState, action: Action) => {
  const newState: State | undefined =
    action && action.type === getType(resetState) ? undefined : state;
  return allReducers(newState, action);
};
