import { combineReducers } from "redux-loop";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import projectFormReducer, {
  initialState as initialProjectFormSTate,
  ProjectFormState
} from "./reducers/projectForm";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";

export interface State {
  readonly auth: AuthState;
  readonly user: UserState;
  readonly projectForm: ProjectFormState;
}

export const initialState: State = {
  auth: initialAuthState,
  user: initialUserState,
  projectForm: initialProjectFormSTate
};

export default combineReducers({
  auth: authReducer,
  user: userReducer,
  projectForm: projectFormReducer
});
