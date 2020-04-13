import { IUser } from "../../shared/entities";

export enum ActionTypes {
  USER_FETCH = "USER_FETCH",
  USER_FETCH_SUCCESS = "USER_FETCH_SUCCESS",
  USER_FETCH_FAILURE = "USER_FETCH_FAILURE"
}

export type UserAction =
  | { readonly type: ActionTypes.USER_FETCH }
  | { readonly type: ActionTypes.USER_FETCH_SUCCESS; readonly user: IUser }
  | { readonly type: ActionTypes.USER_FETCH_FAILURE; readonly errorMsg: string };

export function userFetch(): UserAction {
  return {
    type: ActionTypes.USER_FETCH
  };
}

export function userFetchSuccess(user: IUser): UserAction {
  return {
    type: ActionTypes.USER_FETCH_SUCCESS,
    user
  };
}

export function userFetchFailure(errorMsg: string): UserAction {
  return {
    type: ActionTypes.USER_FETCH_FAILURE,
    errorMsg
  };
}
