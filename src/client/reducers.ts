import { combineReducers } from "redux-loop";
import { UsersResource } from "./actions/users";
import usersReducer from "./reducers/users";
import { Resource } from "./types";

export interface State {
  readonly users: Resource<UsersResource>;
}

export const initialState: State = {
  users: {
    isPending: false
  }
};

export default combineReducers({
  users: usersReducer
});
