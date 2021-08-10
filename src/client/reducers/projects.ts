import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  projectArchive,
  projectArchiveSuccess,
  projectArchiveFailure,
  globalProjectsFetch,
  globalProjectsFetchPage,
  globalProjectsFetchSuccess,
  globalProjectsFetchFailure,
  globalProjectsSetRegion,
  setDeleteProject,
  userProjectsFetch,
  userProjectsFetchSuccess,
  userProjectsFetchFailure,
  userProjectsFetchPage
} from "../actions/projects";

import { IProject, PaginationMetadata } from "../../shared/entities";
import { fetchAllPublishedProjects, fetchProjects, patchProject } from "../api";
import { showResourceFailedToast } from "../functions";
import { Resource } from "../resource";

export interface ProjectsState {
  readonly projects: Resource<readonly IProject[]>;
  readonly globalProjects: Resource<readonly IProject[]>;
  readonly deleteProject?: IProject;
  readonly globalProjectsPagination: PaginationMetadata;
  readonly userProjectsPagination: PaginationMetadata;
  readonly globalProjectsRegion: string | null;
  readonly archiveProjectPending: boolean;
}

export const initialState = {
  // User projects
  projects: { isPending: false },
  userProjectsPagination: {
    currentPage: 1,
    limit: 10,
    totalItems: undefined,
    totalPages: undefined
  },
  // All projects
  globalProjects: { isPending: false },
  globalProjectsPagination: {
    currentPage: 1,
    limit: 8,
    totalItems: undefined,
    totalPages: undefined
  },
  globalProjectsRegion: null,
  archiveProjectPending: false
};

const projectsReducer: LoopReducer<ProjectsState, Action> = (
  state: ProjectsState = initialState,
  action: Action
): ProjectsState | Loop<ProjectsState, Action> => {
  switch (action.type) {
    case getType(userProjectsFetch):
      return loop(
        {
          ...state,
          projects: { isPending: true }
        },
        Cmd.run(fetchProjects, {
          successActionCreator: userProjectsFetchSuccess,
          failActionCreator: userProjectsFetchFailure,
          args: [
            state.userProjectsPagination.currentPage,
            state.userProjectsPagination.limit
          ] as Parameters<typeof fetchProjects>
        })
      );
    case getType(userProjectsFetchPage):
      return loop(
        {
          ...state,
          userProjectsPagination: {
            ...state.userProjectsPagination,
            currentPage: action.payload
          }
        },
        Cmd.action(userProjectsFetch())
      );
    case getType(userProjectsFetchSuccess):
      return {
        ...state,
        projects: { resource: action.payload.items },
        userProjectsPagination: {
          ...state.userProjectsPagination,
          totalItems: action.payload.meta.totalItems,
          totalPages: action.payload.meta.totalPages
        }
      };
    case getType(userProjectsFetchFailure):
      return loop(
        {
          ...state,
          projects: { errorMessage: action.payload }
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(globalProjectsFetch): {
      return loop(
        {
          ...state,
          globalProjects: { isPending: true }
        },
        Cmd.run(fetchAllPublishedProjects, {
          successActionCreator: globalProjectsFetchSuccess,
          failActionCreator: globalProjectsFetchFailure,
          args: [
            state.globalProjectsPagination.currentPage,
            state.globalProjectsPagination.limit,
            state.globalProjectsRegion
          ] as Parameters<typeof fetchAllPublishedProjects>
        })
      );
    }
    case getType(globalProjectsFetchPage):
      return state.globalProjectsPagination.currentPage !== action.payload
        ? loop(
            {
              ...state,
              globalProjectsPagination: {
                ...state.globalProjectsPagination,
                currentPage: action.payload
              }
            },
            Cmd.action(globalProjectsFetch())
          )
        : state;
    case getType(globalProjectsSetRegion):
      return state.globalProjectsRegion !== action.payload
        ? loop(
            {
              ...state,
              globalProjectsRegion: action.payload || null
            },
            Cmd.action(globalProjectsFetch())
          )
        : state;

    case getType(globalProjectsFetchSuccess):
      return {
        ...state,
        globalProjects: { resource: action.payload.items },
        globalProjectsPagination: {
          ...state.globalProjectsPagination,
          totalItems: action.payload.meta.totalItems,
          totalPages: action.payload.meta.totalPages
        }
      };
    case getType(globalProjectsFetchFailure):
      return loop(
        {
          ...state,
          globalProjects: { errorMessage: action.payload }
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
      return loop(
        {
          ...state,
          deleteProject: undefined,
          archiveProjectPending: false,
          globalProjectsPagination: initialState.globalProjectsPagination,
          globalProjects: initialState.globalProjects
        },
        Cmd.action(userProjectsFetchPage(state.userProjectsPagination.currentPage))
      );
    case getType(projectArchiveFailure):
      return loop({ ...state, archiveProjectPending: false }, Cmd.run(showResourceFailedToast));
    default:
      return state;
  }
};

export default projectsReducer;
