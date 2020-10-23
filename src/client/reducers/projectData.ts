import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  updateDistrictsDefinition,
  updateDistrictsDefinitionSuccess,
  updateDistrictsDefinitionFailure,
  projectFetch,
  projectFetchSuccess,
  projectFetchFailure,
  projectDataFetch,
  projectDataFetchFailure,
  projectDataFetchSuccess,
  staticDataFetchFailure,
  staticDataFetchSuccess,
  updateDistrictsDefinitionRefetchGeoJsonSuccess,
  setProjectData
} from "../actions/projectData";
import { clearSelectedGeounits } from "../actions/districtDrawing";
import { ProjectState, initialProjectState } from "./project";
import { resetProjectState } from "../actions/root";
import { DistrictsGeoJSON, DynamicProjectData, StaticProjectData } from "../types";
import { Resource } from "../resource";

import {
  allGeoUnitIndices,
  assignGeounitsToDistrict,
  showActionFailedToast,
  showResourceFailedToast
} from "../functions";
import { fetchProjectData, fetchProjectGeoJson, patchProject } from "../api";
import { fetchAllStaticData } from "../s3";

export type ProjectDataState = {
  readonly projectData: Resource<DynamicProjectData>;
  readonly previousProjectData?: Resource<DynamicProjectData>;
  readonly currentProjectData?: Resource<DynamicProjectData>;
  readonly staticData: Resource<StaticProjectData>;
};

export const initialProjectDataState = {
  projectData: {
    isPending: false
  },
  staticData: {
    isPending: false
  }
};

const projectDataReducer: LoopReducer<ProjectState, Action> = (
  state: ProjectState = initialProjectState,
  action: Action
): ProjectState | Loop<ProjectState, Action> => {
  switch (action.type) {
    case getType(resetProjectState):
      return {
        ...state,
        ...initialProjectDataState
      };
    case getType(projectFetch):
      return loop(
        {
          ...state,
          projectData: {
            ...state.projectData,
            isPending: true
          }
        },
        Cmd.run(fetchProjectData, {
          successActionCreator: projectFetchSuccess,
          failActionCreator: projectFetchFailure,
          args: [action.payload] as Parameters<typeof fetchProjectData>
        })
      );
    case getType(projectFetchSuccess):
      return loop(
        {
          ...state,
          projectData: {
            resource: action.payload
          },
          findIndex: undefined
        },
        Cmd.action(clearSelectedGeounits(false))
      );
    case getType(projectFetchFailure):
      return loop(
        {
          ...state,
          projectData: {
            errorMessage: action.payload
          }
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(setProjectData):
      return "resource" in state.projectData
        ? loop(
            state,
            Cmd.action(
              projectFetchSuccess({ ...state.projectData.resource, project: action.payload })
            )
          )
        : state;
    case getType(projectDataFetch):
      return loop(
        {
          ...state,
          projectData: {
            ...state.projectData,
            isPending: true
          }
        },
        Cmd.run(fetchProjectData, {
          successActionCreator: projectDataFetchSuccess,
          failActionCreator: projectDataFetchFailure,
          args: [action.payload] as Parameters<typeof fetchProjectData>
        })
      );
    case getType(projectDataFetchSuccess):
      return loop(
        {
          ...state,
          projectData: {
            resource: action.payload
          },
          staticData: {
            ...state.staticData,
            isPending: true
          }
        },
        Cmd.run(fetchAllStaticData, {
          successActionCreator: staticDataFetchSuccess,
          failActionCreator: staticDataFetchFailure,
          args: [action.payload.project.regionConfig.s3URI] as Parameters<typeof fetchAllStaticData>
        })
      );
    case getType(projectDataFetchFailure):
      return loop(
        {
          ...state,
          projectData: {
            errorMessage: action.payload
          }
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(staticDataFetchSuccess):
      return {
        ...state,
        staticData: {
          resource: action.payload
        }
      };
    case getType(staticDataFetchFailure):
      return loop(
        {
          ...state,
          staticData: {
            errorMessage: action.payload
          }
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(updateDistrictsDefinition):
      return "resource" in state.projectData && "resource" in state.staticData
        ? loop(
            {
              ...state,
              saving: "saving"
            },
            Cmd.run(patchProject, {
              successActionCreator: updateDistrictsDefinitionSuccess,
              failActionCreator: updateDistrictsDefinitionFailure,
              args: [
                state.projectData.resource.project.id,
                {
                  districtsDefinition: assignGeounitsToDistrict(
                    state.projectData.resource.project.districtsDefinition,
                    state.staticData.resource.geoUnitHierarchy,
                    allGeoUnitIndices(state.undoHistory.present.selectedGeounits),
                    state.selectedDistrictId
                  )
                }
              ] as Parameters<typeof patchProject>
            })
          )
        : state;
    case getType(updateDistrictsDefinitionSuccess):
      return loop(
        {
          ...state
        },
        Cmd.run(
          () => {
            return fetchProjectGeoJson(action.payload.id).then((geojson: DistrictsGeoJSON) => ({
              project: action.payload,
              geojson
            }));
          },
          {
            successActionCreator: updateDistrictsDefinitionRefetchGeoJsonSuccess,
            failActionCreator: updateDistrictsDefinitionFailure
          }
        )
      );
    case getType(updateDistrictsDefinitionRefetchGeoJsonSuccess):
      return loop(
        "resource" in state.projectData
          ? {
              ...state,
              previousProjectData: state.projectData,
              currentProjectData: { resource: action.payload },
              undoHistory: {
                ...state.undoHistory,
                past: [],
                future: []
              }
            }
          : state,
        Cmd.action(projectFetchSuccess(action.payload))
      );
    case getType(updateDistrictsDefinitionFailure):
      return loop(
        {
          ...state,
          saving: "failed"
        },
        Cmd.run(showActionFailedToast)
      );
    default:
      return state as never;
  }
};

export default projectDataReducer;
