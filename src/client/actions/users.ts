import { IUser } from "../../shared/entities";

export enum ActionTypes {
  USERS_FETCH = "USERS_FETCH",
  USERS_FETCH_SUCCESS = "USERS_FETCH_SUCCESS",
  USERS_FETCH_FAILURE = "USERS_FETCH_FAILURE"
}

export type UsersResource = ReadonlyArray<IUser>;

export type UsersAction =
  | { readonly type: ActionTypes.USERS_FETCH }
  | { readonly type: ActionTypes.USERS_FETCH_SUCCESS; readonly users: UsersResource }
  | { readonly type: ActionTypes.USERS_FETCH_FAILURE; readonly errorMsg: string };

export function usersFetch(): UsersAction {
  return {
    type: ActionTypes.USERS_FETCH
  };
}

export function usersFetchSuccess(users: UsersResource): UsersAction {
  return {
    type: ActionTypes.USERS_FETCH_SUCCESS,
    users
  };
}

export function usersFetchFailure(errorMsg: string): UsersAction {
  return {
    type: ActionTypes.USERS_FETCH_FAILURE,
    errorMsg
  };
}
