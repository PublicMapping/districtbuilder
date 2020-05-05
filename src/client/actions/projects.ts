import { createAction } from "typesafe-actions";
import { IProject } from "../../shared/entities";

export const projectsFetch = createAction("Project fetch")();
export const projectsFetchSuccess = createAction("Project fetch success")<readonly IProject[]>();
export const projectsFetchFailure = createAction("Project fetch failure")<string>();
