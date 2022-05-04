import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { userFetch, userFetchFailure, userFetchSuccess } from "../actions/user";

import { IUser } from "@districtbuilder/shared/entities";
import { fetchUser } from "../api";
import { showResourceFailedToast } from "../functions";
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
    case getType(userFetch):
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchUser, {
          successActionCreator: userFetchSuccess,
          failActionCreator: userFetchFailure,
          args: [] as Parameters<typeof fetchUser>
        })
      );
    case getType(userFetchSuccess):
      return {
        resource: action.payload
      };
    case getType(userFetchFailure):
      return loop(
        {
          errorMessage: action.payload
        },
        Cmd.run(showResourceFailedToast)
      );
    default:
      return state;
  }
};

export default userReducer;
