import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import { ActionTypes, authenticateFailure, authenticateSuccess } from "../actions/auth";

import { JWT } from "../../shared/entities";
import { authenticateUser } from "../api";
import { Resource } from "../types";

export type AuthState = Resource<JWT>;

export const initialState = {
  isPending: false
};

const authReducer: LoopReducer<AuthState, Action> = (
  state: AuthState = initialState,
  action: Action
): AuthState | Loop<AuthState, Action> => {
  switch (action.type) {
    case ActionTypes.AUTHENTICATE:
      return loop(
        {
          isPending: true
        },
        Cmd.run(authenticateUser, {
          successActionCreator: authenticateSuccess,
          failActionCreator: authenticateFailure,
          args: [action.loginForm.email, action.loginForm.password] as Parameters<
            typeof authenticateUser
          >
        })
      );
    case ActionTypes.AUTHENTICATE_SUCCESS:
      return {
        resource: action.jwt
      };
    case ActionTypes.AUTHENTICATE_FAILURE:
      return {
        errorMessage: action.errorMessage
      };
    default:
      return state;
  }
};

export default authReducer;
