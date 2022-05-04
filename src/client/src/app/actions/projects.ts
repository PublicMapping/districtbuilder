import { createAction } from "typesafe-actions";
import { IProject, ProjectId } from "@districtbuilder/shared/entities";
import { PaginatedResponse } from "../types";

export const userProjectsFetch = createAction("Projects fetch")();
export const userProjectsFetchPage = createAction("User projects fetch page")<number>();
export const userProjectsFetchSuccess =
  createAction("Projects fetch success")<PaginatedResponse<IProject>>();
export const userProjectsFetchFailure = createAction("Projects fetch failure")<string>();

export const globalProjectsFetch = createAction("Global projects fetch")();
export const globalProjectsSetRegion = createAction("Global projects set region")<string | null>();
export const globalProjectsFetchPage = createAction("Global projects fetch page")<number>();
export const globalProjectsFetchSuccess = createAction("Global projects fetch success")<
  PaginatedResponse<IProject>
>();
export const globalProjectsFetchFailure = createAction("Global projects fetch failure")<string>();

export const setDeleteProject = createAction("Set the id for the delete project modal")<
  IProject | undefined
>();

export const setTemplateProject = createAction("Set the id for the template project modal")<
  IProject | undefined
>();

export const projectArchive = createAction("Archive project")<ProjectId>();
export const projectArchiveSuccess = createAction("Archive project success")<IProject>();
export const projectArchiveFailure = createAction("Archive project failure")<string>();
