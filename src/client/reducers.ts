import { combineReducers } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "./actions";
import { resetState } from "./actions/root";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import organizationReducer, {
  OrganizationState,
  initialState as initialOrganizationState
} from "./reducers/organization";
import organizationJoinReducer, {
  OrganizationJoinState,
  initialState as initialOrganizationJoinState
} from "./reducers/organizationJoin";
import projectsReducer, {
  initialState as initialProjectsState,
  ProjectsState
} from "./reducers/projects";
import regionConfigReducer, {
  initialState as initialRegionConfigState,
  RegionConfigState
} from "./reducers/regionConfig";
import organizationProjectsReducer, {
  initialState as intialOrganizationProjectsState,
  OrganizationProjectsState
} from "./reducers/organizationProjects";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";
import projectReducer, { ProjectState, initialProjectState } from "./reducers/project";

export interface State {
  readonly auth: AuthState;
  readonly project: ProjectState;
  readonly projects: ProjectsState;
  readonly organization: OrganizationState;
  readonly organizationJoin: OrganizationJoinState;
  readonly organizationProjects: OrganizationProjectsState;
  readonly regionConfig: RegionConfigState;
  readonly user: UserState;
}

export const initialState: State = {
  auth: initialAuthState,
  organization: initialOrganizationState,
  organizationJoin: initialOrganizationJoinState,
  organizationProjects: intialOrganizationProjectsState,
  project: initialProjectState,
  projects: initialProjectsState,
  regionConfig: initialRegionConfigState,
  user: initialUserState
};

const allReducers = combineReducers({
  auth: authReducer,
  organization: organizationReducer,
  organizationJoin: organizationJoinReducer,
  organizationProjects: organizationProjectsReducer,
  project: projectReducer,
  projects: projectsReducer,
  regionConfig: regionConfigReducer,
  user: userReducer
});

export default (state = initialState, action: Action) => {
  const newState: State | undefined =
    action && action.type === getType(resetState) ? undefined : state;
  return allReducers(newState, action);
};
