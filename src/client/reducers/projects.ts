import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  projectArchive,
  projectArchiveSuccess,
  projectArchiveFailure,
  projectsFetch,
  projectsFetchFailure,
  projectsFetchSuccess,
  setDeleteProject
} from "../actions/projects";

import { IProject } from "../../shared/entities";
import { fetchProjects, patchProject } from "../api";
import { showResourceFailedToast } from "../functions";
import { Resource } from "../resource";

export interface ProjectsState {
  readonly projects: Resource<readonly IProject[]>;
  readonly deleteProject?: IProject;
  readonly archiveProjectPending: boolean;
}

export const initialState = {
  projects: { isPending: false },
  archiveProjectPending: false
};

const projectsReducer: LoopReducer<ProjectsState, Action> = (
  state: ProjectsState = initialState,
  action: Action
): ProjectsState | Loop<ProjectsState, Action> => {
  switch (action.type) {
    case getType(projectsFetch):
      return loop(
        {
          ...state,
          projects: { isPending: true }
        },
        Cmd.run(fetchProjects, {
          successActionCreator: projectsFetchSuccess,
          failActionCreator: projectsFetchFailure,
          args: [] as Parameters<typeof fetchProjects>
        })
      );
    case getType(projectsFetchSuccess):
      return {
        ...state,
        projects: { resource: action.payload }
      };
    case getType(projectsFetchFailure):
      return loop(
        {
          ...state,
          projects: { errorMessage: action.payload }
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(setDeleteProject):
      return {
        ...state,
        deleteProject: action.payload
      };
    case getType(projectArchive):
      return loop(
        { ...state, archiveProjectPending: true },
        Cmd.run(patchProject, {
          successActionCreator: projectArchiveSuccess,
          failActionCreator: projectArchiveFailure,
          args: [action.payload, { archived: true }] as Parameters<typeof patchProject>
        })
      );
    case getType(projectArchiveSuccess):
      return "resource" in state.projects
        ? {
            deleteProject: undefined,
            archiveProjectPending: false,
            projects: {
              resource: state.projects.resource.map(project =>
                project.id !== action.payload.id ? project : action.payload
              )
            }
          }
        : state;
    case getType(projectArchiveFailure):
      return loop({ ...state, archiveProjectPending: false }, Cmd.run(showResourceFailedToast));
    default:
      return state;
  }
};

export default projectsReducer;
