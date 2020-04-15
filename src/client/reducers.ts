import { combineReducers } from "redux-loop";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import userReducer, { initialState as initialUserState, UserState } from "./reducers/user";

export interface State {
  readonly auth: AuthState;
  readonly user: UserState;
}

export const initialState: State = {
  auth: initialAuthState,
  user: initialUserState
};

export default combineReducers({
  auth: authReducer,
  user: userReducer
});
