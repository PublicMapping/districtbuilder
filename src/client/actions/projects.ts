import { IProject } from "../../shared/entities";

export enum ActionTypes {
  PROJECTS_FETCH = "PROJECTS_FETCH",
  PROJECTS_FETCH_SUCCESS = "PROJECTS_FETCH_SUCCESS",
  PROJECTS_FETCH_FAILURE = "PROJECTS_FETCH_FAILURE"
}

export type ProjectsAction =
  | { readonly type: ActionTypes.PROJECTS_FETCH }
  | { readonly type: ActionTypes.PROJECTS_FETCH_SUCCESS; readonly projects: readonly IProject[] }
  | { readonly type: ActionTypes.PROJECTS_FETCH_FAILURE; readonly errorMessage: string };

export function projectsFetch(): ProjectsAction {
  return {
    type: ActionTypes.PROJECTS_FETCH
  };
}

export function projectsFetchSuccess(projects: readonly IProject[]): ProjectsAction {
  return {
    type: ActionTypes.PROJECTS_FETCH_SUCCESS,
    projects
  };
}

export function projectsFetchFailure(errorMessage: string): ProjectsAction {
  return {
    type: ActionTypes.PROJECTS_FETCH_FAILURE,
    errorMessage
  };
}
