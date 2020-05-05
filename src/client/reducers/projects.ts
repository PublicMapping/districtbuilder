import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { projectsFetch, projectsFetchFailure, projectsFetchSuccess } from "../actions/projects";

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
    case getType(projectsFetch):
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
    case getType(projectsFetchSuccess):
      return {
        resource: action.payload
      };
    case getType(projectsFetchFailure):
      return {
        errorMessage: action.payload
      };
    default:
      return state;
  }
};

export default projectsReducer;
