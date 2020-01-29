import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import {
  ActionTypes,
  UsersAction,
  usersFetchFailure,
  usersFetchSuccess,
  UsersResource
} from "../actions/users";

import { fetchUsers } from "../api";
import { Resource } from "../types";

const initialState = {
  isPending: false
};

const usersReducer: LoopReducer<Resource<UsersResource>, Action> = (
  state: Resource<UsersResource> = initialState,
  action: UsersAction
): Resource<UsersResource> | Loop<Resource<UsersResource>, Action> => {
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
