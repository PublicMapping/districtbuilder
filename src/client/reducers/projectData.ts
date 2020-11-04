import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  updateDistrictsDefinition,
  updateDistrictsDefinitionSuccess,
  updateProjectFailed,
  projectFetch,
  projectFetchSuccess,
  projectFetchFailure,
  projectDataFetch,
  projectDataFetchFailure,
  projectDataFetchSuccess,
  staticDataFetchFailure,
  staticDataFetchSuccess,
  updateDistrictsDefinitionRefetchGeoJsonSuccess,
  setProjectNameEditing,
  updateProjectName,
  updateProjectNameSuccess
} from "../actions/projectData";
import { clearSelectedGeounits, setSavingState } from "../actions/districtDrawing";
import { updateCurrentState } from "../reducers/districtDrawing";
import { IProject } from "../../shared/entities";
import { ProjectState, initialProjectState } from "./project";
import { resetProjectState } from "../actions/root";
import { DistrictsGeoJSON, DynamicProjectData, SavingState, StaticProjectData } from "../types";
import { Resource } from "../resource";

import {
  allGeoUnitIndices,
  assignGeounitsToDistrict,
  showActionFailedToast,
  showResourceFailedToast
} from "../functions";
import { fetchProjectData, fetchProjectGeoJson, patchProject } from "../api";
import { fetchAllStaticData } from "../s3";

function fetchGeoJsonForProject(project: IProject) {
  return () => {
    return fetchProjectGeoJson(project.id).then((geojson: DistrictsGeoJSON) => ({
      project,
      geojson
    }));
  };
}

export type ProjectDataState = {
  readonly projectData: Resource<DynamicProjectData>;
  readonly staticData: Resource<StaticProjectData>;
  readonly projectNameSaving: SavingState;
};

export const initialProjectDataState = {
  projectData: {
    isPending: false
  },
  staticData: {
    isPending: false
  },
  projectNameSaving: "saved"
} as const;

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
        updateCurrentState(
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
          {
            districtsDefinition: action.payload.project.districtsDefinition
          }
        ),
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
    case getType(setProjectNameEditing):
      return { ...state, projectNameSaving: action.payload ? "unsaved" : "saved" };
    // eslint-disable-next-line
    case getType(updateProjectName): {
      if ("resource" in state.projectData) {
        const projectId = state.projectData.resource.project.id;
        const { geojson } = state.projectData.resource;
        return loop(
          {
            ...state,
            projectNameSaving: "saving"
          },
          Cmd.run(
            () =>
              patchProject(projectId, { name: action.payload }).then(project => ({
                project,
                geojson
              })),
            {
              successActionCreator: updateProjectNameSuccess,
              failActionCreator: updateProjectFailed
            }
          )
        );
      } else {
        return state;
      }
    }
    case getType(updateProjectNameSuccess):
      return {
        ...state,
        projectNameSaving: "saved",
        saving: "saved",
        projectData: { resource: action.payload }
      };
    case getType(updateDistrictsDefinition):
      return "resource" in state.projectData && "resource" in state.staticData
        ? loop(
            {
              ...state,
              saving: "saving"
            },
            Cmd.list<Action>(
              [
                Cmd.run(patchProject, {
                  successActionCreator: updateDistrictsDefinitionSuccess,
                  failActionCreator: updateProjectFailed,
                  args: [
                    state.projectData.resource.project.id,
                    {
                      // Districts definition may be optionally specified in the action to make this
                      // action apply to a snapshot of state to allow for undoing/redoings changes
                      // to districts
                      districtsDefinition:
                        action.payload ||
                        assignGeounitsToDistrict(
                          state.projectData.resource.project.districtsDefinition,
                          state.staticData.resource.geoUnitHierarchy,
                          allGeoUnitIndices(state.undoHistory.present.state.selectedGeounits),
                          state.selectedDistrictId
                        )
                    }
                  ] as Parameters<typeof patchProject>
                }),
                action.payload
                  ? Cmd.action(setSavingState("saved"))
                  : Cmd.action(clearSelectedGeounits(false))
              ],
              { sequence: true }
            )
          )
        : state;
    case getType(updateDistrictsDefinitionSuccess):
      return loop(
        state,
        Cmd.run(fetchGeoJsonForProject(action.payload), {
          successActionCreator: updateDistrictsDefinitionRefetchGeoJsonSuccess,
          failActionCreator: updateProjectFailed
        })
      );
    case getType(updateDistrictsDefinitionRefetchGeoJsonSuccess): {
      return "resource" in state.projectData
        ? updateCurrentState(
            {
              ...state,
              projectData: {
                resource: action.payload
              }
            },
            {
              districtsDefinition: action.payload.project.districtsDefinition
            }
          )
        : state;
    }
    case getType(updateProjectFailed):
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
