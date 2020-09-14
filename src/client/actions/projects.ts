import { createAction } from "typesafe-actions";
import { IProject } from "../../shared/entities";

export const projectsFetch = createAction("Projects fetch")();
export const projectsFetchSuccess = createAction("Projects fetch success")<readonly IProject[]>();
export const projectsFetchFailure = createAction("Projects fetch failure")<string>();
