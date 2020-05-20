import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  projectDataFetch,
  projectFetch,
  projectFetchFailure,
  projectFetchSuccess,
  staticGeoLevelsFetch,
  staticGeoLevelsFetchFailure,
  staticGeoLevelsFetchSuccess,
  staticMetadataFetch,
  staticMetadataFetchFailure,
  staticMetadataFetchSuccess
} from "../actions/projectData";

import { IProject, IStaticMetadata } from "../../shared/entities";
import { fetchProject } from "../api";
import { Resource } from "../resource";
import { fetchStaticFiles, fetchStaticMetadata } from "../s3";

export interface ProjectDataState {
  readonly project: Resource<IProject>;
  readonly staticMetadata: Resource<IStaticMetadata>;
  readonly staticGeoLevels: Resource<ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>>;
}

export const initialState = {
  project: { isPending: false },
  staticMetadata: { isPending: false },
  staticGeoLevels: { isPending: false }
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
      return "resource" in state.project
        ? loop(
            {
              ...state,
              staticMetadata: {
                resource: action.payload
              }
            },
            Cmd.action(
              staticGeoLevelsFetch({
                s3URI: state.project.resource.regionConfig.s3URI,
                geoLevels: action.payload.geoLevels
              })
            )
          )
        : (state as never);
    case getType(staticMetadataFetchFailure):
      return {
        ...state,
        staticMetadata: {
          errorMessage: action.payload
        }
      };
    case getType(staticGeoLevelsFetch):
      return loop(
        {
          ...state,
          staticGeoLevels: {
            isPending: true
          }
        },
        Cmd.run(fetchStaticFiles, {
          successActionCreator: staticGeoLevelsFetchSuccess,
          failActionCreator: staticGeoLevelsFetchFailure,
          args: [action.payload.s3URI, action.payload.geoLevels] as Parameters<
            typeof fetchStaticFiles
          >
        })
      );

    case getType(staticGeoLevelsFetchSuccess):
      return {
        ...state,
        staticGeoLevels: {
          resource: action.payload
        }
      };
    case getType(staticGeoLevelsFetchFailure):
      return {
        ...state,
        staticGeoLevels: {
          errorMessage: action.payload
        }
      };
    default:
      return state;
  }
};

export default projectDataReducer;
