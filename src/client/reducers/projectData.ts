import { FeatureCollection, MultiPolygon } from "geojson";
import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  projectDataFetch,
  projectFetch,
  projectFetchFailure,
  projectFetchGeoJson,
  projectFetchGeoJsonFailure,
  projectFetchGeoJsonSuccess,
  projectFetchSuccess,
  staticDemographicsFetchFailure,
  staticDemographicsFetchSuccess,
  staticGeoLevelsFetchFailure,
  staticGeoLevelsFetchSuccess,
  staticGeounitHierarchyFetchFailure,
  staticGeounitHierarchyFetchSuccess,
  staticMetadataFetchFailure,
  staticMetadataFetchSuccess
} from "../actions/projectData";
import { clearSelectedGeounitIds } from "../actions/districtDrawing";

import {
  DistrictProperties,
  GeoUnitHierarchy,
  IProject,
  IStaticMetadata
} from "../../shared/entities";
import { fetchProject, fetchProjectGeoJson } from "../api";
import { Resource } from "../resource";
import { fetchStaticFiles, fetchStaticMetadata, fetchGeoUnitHierarchy } from "../s3";

export interface ProjectDataState {
  readonly project: Resource<IProject>;
  readonly staticMetadata: Resource<IStaticMetadata>;
  readonly staticGeoLevels: Resource<ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>>;
  readonly staticDemographics: Resource<ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>>;
  readonly geojson: Resource<FeatureCollection<MultiPolygon, DistrictProperties>>;
  readonly geoUnitHierarchy: Resource<GeoUnitHierarchy>;
}

export const initialState = {
  project: { isPending: false },
  staticMetadata: { isPending: false },
  staticGeoLevels: { isPending: false },
  staticDemographics: { isPending: false },
  geojson: { isPending: false },
  geoUnitHierarchy: { isPending: false }
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
        Cmd.list<Action>([
          Cmd.run(fetchProject, {
            successActionCreator: projectFetchSuccess,
            failActionCreator: projectFetchFailure,
            args: [action.payload] as Parameters<typeof fetchProject>
          }),
          Cmd.action(projectFetchGeoJson(action.payload))
        ])
      );
    case getType(projectFetchSuccess):
      return loop(
        {
          ...state,
          project: { resource: action.payload },
          staticMetadata: {
            isPending: true
          }
        },
        Cmd.list<Action>([
          Cmd.run(fetchStaticMetadata, {
            successActionCreator: staticMetadataFetchSuccess,
            failActionCreator: staticMetadataFetchFailure,
            args: [action.payload.regionConfig.s3URI] as Parameters<typeof fetchStaticMetadata>
          }),
          Cmd.run(fetchGeoUnitHierarchy, {
            successActionCreator: staticGeounitHierarchyFetchSuccess,
            failActionCreator: staticGeounitHierarchyFetchFailure,
            args: [action.payload.regionConfig.s3URI] as Parameters<typeof fetchGeoUnitHierarchy>
          })
        ])
      );
    case getType(projectFetchFailure):
      return {
        ...state,
        project: { errorMessage: action.payload }
      };
    case getType(projectFetchGeoJsonSuccess):
      return loop(
        {
          ...state,
          geojson: { resource: action.payload }
        },
        Cmd.action(clearSelectedGeounitIds())
      );
    case getType(projectFetchGeoJson):
      return loop(
        {
          ...state,
          geojson: {
            ...state.geojson,
            isPending: true
          }
        },
        Cmd.run(fetchProjectGeoJson, {
          successActionCreator: projectFetchGeoJsonSuccess,
          failActionCreator: projectFetchGeoJsonFailure,
          args: [action.payload] as Parameters<typeof fetchProjectGeoJson>
        })
      );
    case getType(projectFetchGeoJsonFailure):
      return {
        ...state,
        geojson: { errorMessage: action.payload }
      };
    case getType(staticMetadataFetchSuccess):
      return "resource" in state.project
        ? loop(
            {
              ...state,
              staticMetadata: {
                resource: action.payload
              },
              staticGeoLevels: {
                isPending: true
              },
              staticDemographics: {
                isPending: true
              }
            },
            Cmd.list<Action>([
              Cmd.run(fetchStaticFiles, {
                successActionCreator: staticGeoLevelsFetchSuccess,
                failActionCreator: staticGeoLevelsFetchFailure,
                args: [
                  state.project.resource.regionConfig.s3URI,
                  action.payload.geoLevels
                ] as Parameters<typeof fetchStaticFiles>
              }),
              Cmd.run(fetchStaticFiles, {
                successActionCreator: staticDemographicsFetchSuccess,
                failActionCreator: staticDemographicsFetchFailure,
                args: [
                  state.project.resource.regionConfig.s3URI,
                  action.payload.demographics
                ] as Parameters<typeof fetchStaticFiles>
              })
            ])
          )
        : (state as never);
    case getType(staticMetadataFetchFailure):
      return {
        ...state,
        staticMetadata: {
          errorMessage: action.payload
        }
      };
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
    case getType(staticDemographicsFetchSuccess):
      return {
        ...state,
        staticDemographics: {
          resource: action.payload
        }
      };
    case getType(staticDemographicsFetchFailure):
      return {
        ...state,
        staticDemographics: {
          errorMessage: action.payload
        }
      };
    case getType(staticGeounitHierarchyFetchSuccess):
      return {
        ...state,
        geoUnitHierarchy: {
          resource: action.payload
        }
      };
    case getType(staticGeounitHierarchyFetchFailure):
      return {
        ...state,
        geoUnitHierarchy: {
          errorMessage: action.payload
        }
      };
    default:
      return state as never;
  }
};

export default projectDataReducer;
