import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import { projectFetchSuccess, projectFetch, projectFetchFailure } from "../actions/project";
import { staticMetadataFetch } from "../actions/staticMetadata";

import { IProject } from "../../shared/entities";
import { fetchProject } from "../api";
import { Resource } from "../resource";

export type ProjectState = Resource<IProject>;

export const initialState = {
  isPending: false
};

const projectReducer: LoopReducer<ProjectState, Action> = (
  state: ProjectState = initialState,
  action: Action
): ProjectState | Loop<ProjectState, Action> => {
  switch (action.type) {
    case getType(projectFetch):
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchProject, {
          successActionCreator: projectFetchSuccess,
          failActionCreator: projectFetchFailure,
          args: [action.payload] as Parameters<typeof fetchProject>
        })
      );
    case getType(projectFetchSuccess):
      return loop(
        {
          resource: action.payload
        },
        Cmd.action(staticMetadataFetch(action.payload.regionConfig.s3URI))
      );
    case getType(projectFetchFailure):
      return {
        errorMessage: action.payload
      };
    default:
      return state;
  }
};

export default projectReducer;
