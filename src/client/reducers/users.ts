import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import { ActionTypes, Users, usersFetchFailure, usersFetchSuccess } from "../actions/users";

import { fetchUsers } from "../api";
import { Resource } from "../types";

export type UsersState = Resource<Users>;

export const initialState = {
  isPending: false
};

const usersReducer: LoopReducer<UsersState, Action> = (
  state: UsersState = initialState,
  action: Action
): UsersState | Loop<UsersState, Action> => {
  switch (action.type) {
    case ActionTypes.USERS_FETCH:
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchUsers, {
          successActionCreator: usersFetchSuccess,
          failActionCreator: usersFetchFailure,
          args: []
        })
      );
    case ActionTypes.USERS_FETCH_SUCCESS:
      return {
        resource: action.users
      };
    case ActionTypes.USERS_FETCH_FAILURE:
      return {
        errorMessage: action.errorMsg
      };
    default:
      return state;
  }
};

export default usersReducer;
