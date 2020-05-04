import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { authenticate, authenticateFailure, authenticateSuccess } from "../actions/auth";

import { JWT } from "../../shared/entities";
import { authenticateUser } from "../api";
import { Resource } from "../resource";

export type AuthState = Resource<JWT>;

export const initialState = {
  isPending: false
};

const authReducer: LoopReducer<AuthState, Action> = (
  state: AuthState = initialState,
  action: Action
): AuthState | Loop<AuthState, Action> => {
  switch (action.type) {
    case getType(authenticate):
      return loop(
        {
          isPending: true
        },
        Cmd.run(authenticateUser, {
          successActionCreator: authenticateSuccess,
          failActionCreator: authenticateFailure,
          args: [action.payload.email, action.payload.password] as Parameters<
            typeof authenticateUser
          >
        })
      );
    case getType(authenticateSuccess):
      return {
        resource: action.payload
      };
    case getType(authenticateFailure):
      return {
        errorMessage: action.payload
      };
    default:
      return state;
  }
};

export default authReducer;
