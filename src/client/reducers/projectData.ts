import { FeatureCollection, MultiPolygon } from "geojson";
import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  addSelectedGeounitIds,
  clearSelectedGeounitIds,
  patchDistrictsDefinitionSuccess,
  patchDistrictsDefinitionFailure,
  projectDataFetch,
  projectFetch,
  projectFetchFailure,
  projectFetchGeoJson,
  projectFetchGeoJsonFailure,
  projectFetchGeoJsonSuccess,
  projectFetchSuccess,
  removeSelectedGeounitIds,
  saveDistrictsDefinition,
  setSelectedDistrictId,
  staticDemographicsFetchFailure,
  staticDemographicsFetchSuccess,
  staticGeoLevelsFetchFailure,
  staticGeoLevelsFetchSuccess,
  staticMetadataFetchFailure,
  staticMetadataFetchSuccess
} from "../actions/projectData";

import { DistrictProperties, IProject, IStaticMetadata } from "../../shared/entities";
import { fetchProject, fetchProjectGeoJson, patchDistrictsDefinition } from "../api";
import { Resource } from "../resource";
import { fetchStaticFiles, fetchStaticMetadata } from "../s3";

export interface ProjectDataState {
  readonly project: Resource<IProject>;
  readonly staticMetadata: Resource<IStaticMetadata>;
  readonly staticGeoLevels: Resource<ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>>;
  readonly staticDemographics: Resource<ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>>;
  readonly geojson: Resource<FeatureCollection<MultiPolygon, DistrictProperties>>;
  readonly selectedDistrictId: number;
  readonly selectedGeounitIds: ReadonlySet<number>;
}

export const initialState = {
  project: { isPending: false },
  staticMetadata: { isPending: false },
  staticGeoLevels: { isPending: false },
  staticDemographics: { isPending: false },
  geojson: { isPending: false },
  selectedDistrictId: 1,
  selectedGeounitIds: new Set([])
};

// TODO: this reducer is getting large. Some of the actions should be split out
// into a separate module that deals more with district selection.
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
        Cmd.run(fetchStaticMetadata, {
          successActionCreator: staticMetadataFetchSuccess,
          failActionCreator: staticMetadataFetchFailure,
          args: [action.payload.regionConfig.s3URI] as Parameters<typeof fetchStaticMetadata>
        })
      );
    case getType(projectFetchFailure):
      return {
        ...state,
        project: { errorMessage: action.payload }
      };
    case getType(projectFetchGeoJsonSuccess):
      return {
        ...state,
        geojson: { resource: action.payload }
      };
    case getType(projectFetchGeoJson):
      return loop(
        {
          ...state,
          geojson: { errorMessage: action.payload }
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
    case getType(setSelectedDistrictId):
      return {
        ...state,
        selectedDistrictId: action.payload
      };
    case getType(addSelectedGeounitIds):
      return {
        ...state,
        selectedGeounitIds: new Set([...state.selectedGeounitIds, ...action.payload])
      };
    case getType(removeSelectedGeounitIds):
      // eslint-disable-next-line
      const mutableSelected = new Set([...state.selectedGeounitIds]);
      [...action.payload].forEach(function(v) {
        mutableSelected.delete(v);
      });
      return {
        ...state,
        selectedGeounitIds: mutableSelected
      };
    case getType(clearSelectedGeounitIds):
      return {
        ...state,
        selectedGeounitIds: new Set([])
      };
    case getType(saveDistrictsDefinition):
      return "resource" in state.project
        ? loop(
            state,
            Cmd.run(patchDistrictsDefinition, {
              successActionCreator: patchDistrictsDefinitionSuccess,
              failActionCreator: patchDistrictsDefinitionFailure,
              args: [
                state.project.resource.id,
                // TODO: we are only dealing with the top-most geolevel at the moment, so this
                // will need to be modified when we support all geolevels.
                [...state.selectedGeounitIds].reduce((newDistrictsDefinition, geounitId) => {
                  // @ts-ignore
                  // eslint-disable-next-line
                  newDistrictsDefinition[geounitId] = state.selectedDistrictId;
                  return newDistrictsDefinition;
                }, state.project.resource.districtsDefinition)
              ] as Parameters<typeof patchDistrictsDefinition>
            })
          )
        : (state as never);
    case getType(patchDistrictsDefinitionSuccess):
      return loop(
        {
          ...state,
          project: { resource: action.payload },
          selectedGeounitIds: new Set([])
        },
        Cmd.action(projectFetchGeoJson(action.payload.id))
      );
    case getType(patchDistrictsDefinitionFailure):
      // TODO: implement a status area to display errors for this and other things
      // eslint-disable-next-line
      console.log("Error patching districts definition: ", action.payload);
      return state;

    default:
      return state as never;
  }
};

export default projectDataReducer;
