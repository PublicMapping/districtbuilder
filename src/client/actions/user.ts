import { createAction } from "typesafe-actions";
import { IUser } from "../../shared/entities";

export const userFetch = createAction("User fetch")();
export const userFetchSuccess = createAction("User fetch success")<IUser>();
export const userFetchFailure = createAction("User fetch failure")<string>();
