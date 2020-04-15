import { JWT, Login } from "../../shared/entities";

export enum ActionTypes {
  AUTHENTICATE = "AUTHENTICATE",
  AUTHENTICATE_SUCCESS = "AUTHENTICATE_SUCCESS",
  AUTHENTICATE_FAILURE = "AUTHENTICATE_FAILURE"
}

export type AuthAction =
  | { readonly type: ActionTypes.AUTHENTICATE; readonly loginForm: Login }
  | { readonly type: ActionTypes.AUTHENTICATE_SUCCESS; readonly jwt: JWT }
  | { readonly type: ActionTypes.AUTHENTICATE_FAILURE; readonly errorMessage: string };

export function authenticate(loginForm: Login): AuthAction {
  return {
    type: ActionTypes.AUTHENTICATE,
    loginForm
  };
}

export function authenticateSuccess(jwt: JWT): AuthAction {
  return {
    type: ActionTypes.AUTHENTICATE_SUCCESS,
    jwt
  };
}

export function authenticateFailure(errorMessage: string): AuthAction {
  return {
    type: ActionTypes.AUTHENTICATE_FAILURE,
    errorMessage
  };
}
