import { combineReducers } from "redux-loop";
import authReducer, { AuthState, initialState as initialAuthState } from "./reducers/auth";
import usersReducer, { initialState as initialUsersState, UsersState } from "./reducers/users";

export interface State {
  readonly auth: AuthState;
  readonly users: UsersState;
}

export const initialState: State = {
  auth: initialAuthState,
  users: initialUsersState
};

export default combineReducers({
  auth: authReducer,
  users: usersReducer
});
