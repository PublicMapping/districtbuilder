import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  projectDataFetch,
  projectFetch,
  projectFetchFailure,
  projectFetchSuccess,
  staticMetadataFetch,
  staticMetadataFetchFailure,
  staticMetadataFetchSuccess
} from "../actions/projectData";

import { IProject, IStaticMetadata } from "../../shared/entities";
import { fetchProject } from "../api";
import { Resource } from "../resource";
import { fetchStaticMetadata } from "../s3";

export interface ProjectDataState {
  readonly project: Resource<IProject>;
  readonly staticMetadata: Resource<IStaticMetadata>;
}

export const initialState = {
  project: { isPending: false },
  staticMetadata: { isPending: false }
};

const projectDataReducer: LoopReducer<ProjectDataState, Action> = (
  state: ProjectDataState = initialState,
  action: Action
): ProjectDataState | Loop<ProjectDataState, Action> => {
  switch (action.type) {
    case getType(projectDataFetch):
      return loop(state, Cmd.action(projectFetch(action.payload)));
    case getType(projectFetch):
      return loop(
        { ...state, project: { isPending: true } },
        Cmd.run(fetchProject, {
          successActionCreator: projectFetchSuccess,
          failActionCreator: projectFetchFailure,
          args: [action.payload] as Parameters<typeof fetchProject>
        })
      );
    case getType(projectFetchSuccess):
      return loop(
        { ...state, project: { resource: action.payload } },
        Cmd.action(staticMetadataFetch(action.payload.regionConfig.s3URI))
      );
    case getType(projectFetchFailure):
      return {
        ...state,
        project: { errorMessage: action.payload }
      };
    case getType(staticMetadataFetch):
      return loop(
        {
          ...state,
          staticMetadata: {
            isPending: true
          }
        },
        Cmd.run(fetchStaticMetadata, {
          successActionCreator: staticMetadataFetchSuccess,
          failActionCreator: staticMetadataFetchFailure,
          args: [action.payload] as Parameters<typeof fetchStaticMetadata>
        })
      );
    case getType(staticMetadataFetchSuccess):
      return {
        ...state,
        staticMetadata: {
          resource: action.payload
        }
      };
    case getType(staticMetadataFetchFailure):
      return {
        ...state,
        staticMetadata: {
          errorMessage: action.payload
        }
      };
    default:
      return state;
  }
};

export default projectDataReducer;
