import { createAction } from "typesafe-actions";
import { IProject, ProjectId } from "../../shared/entities";

export const projectFetch = createAction("Project fetch")<ProjectId>();
export const projectFetchSuccess = createAction("Project fetch success")<IProject>();
export const projectFetchFailure = createAction("Project fetch failure")<string>();
