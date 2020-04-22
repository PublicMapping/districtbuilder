import { combineReducers } from "redux-loop";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import projectFormReducer, {
  initialState as initialProjectFormState,
  ProjectFormState
} from "./reducers/projectForm";
import regionConfigReducer, {
  initialState as initialRegionConfigState,
  RegionConfigState
} from "./reducers/regionConfig";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";

export interface State {
  readonly auth: AuthState;
  readonly user: UserState;
  readonly projectForm: ProjectFormState;
  readonly regionConfig: RegionConfigState;
}

export const initialState: State = {
  auth: initialAuthState,
  user: initialUserState,
  projectForm: initialProjectFormState,
  regionConfig: initialRegionConfigState
};

export default combineReducers({
  auth: authReducer,
  user: userReducer,
  projectForm: projectFormReducer,
  regionConfig: regionConfigReducer
});
