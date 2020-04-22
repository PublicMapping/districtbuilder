import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import { ActionTypes, userFetchFailure, userFetchSuccess } from "../actions/user";

import { IUser } from "../../shared/entities";
import { fetchUser } from "../api";
import { Resource } from "../resource";

export type UserState = Resource<IUser>;

export const initialState = {
  isPending: false
};

const userReducer: LoopReducer<UserState, Action> = (
  state: UserState = initialState,
  action: Action
): UserState | Loop<UserState, Action> => {
  switch (action.type) {
    case ActionTypes.USER_FETCH:
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchUser, {
          successActionCreator: userFetchSuccess,
          failActionCreator: userFetchFailure,
          args: []
        })
      );
    case ActionTypes.USER_FETCH_SUCCESS:
      return {
        resource: action.user
      };
    case ActionTypes.USER_FETCH_FAILURE:
      return {
        errorMessage: action.errorMsg
      };
    default:
      return state;
  }
};

export default userReducer;
