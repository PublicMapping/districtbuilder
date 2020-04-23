import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import { ActionTypes, projectsFetchFailure, projectsFetchSuccess } from "../actions/projects";

import { IProject } from "../../shared/entities";
import { fetchProjects } from "../api";
import { Resource } from "../resource";

export type ProjectsState = Resource<readonly IProject[]>;

export const initialState = {
  isPending: false
};

const projectsReducer: LoopReducer<ProjectsState, Action> = (
  state: ProjectsState = initialState,
  action: Action
): ProjectsState | Loop<ProjectsState, Action> => {
  switch (action.type) {
    case ActionTypes.PROJECTS_FETCH:
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchProjects, {
          successActionCreator: projectsFetchSuccess,
          failActionCreator: projectsFetchFailure,
          args: []
        })
      );
    case ActionTypes.PROJECTS_FETCH_SUCCESS:
      return {
        resource: action.projects
      };
    case ActionTypes.PROJECTS_FETCH_FAILURE:
      return {
        errorMessage: action.errorMessage
      };
    default:
      return state;
  }
};

export default projectsReducer;
