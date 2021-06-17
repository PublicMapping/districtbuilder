import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  exportCsv,
  exportCsvFailure,
  exportGeoJson,
  exportGeoJsonFailure,
  exportShp,
  exportShpFailure,
  projectDataFetch,
  projectDataFetchFailure,
  projectDataFetchSuccess,
  projectFetch,
  projectFetchFailure,
  projectFetchSuccess,
  setProjectNameEditing,
  staticDataFetchFailure,
  staticDataFetchSuccess,
  duplicateProject,
  duplicateProjectSuccess,
  duplicateProjectFailure,
  updateDistrictLocks,
  updateDistrictLocksFailure,
  updateDistrictLocksSuccess,
  updateDistrictsDefinition,
  updateDistrictsDefinitionRefetchGeoJsonSuccess,
  updateDistrictsDefinitionSuccess,
  updateProjectFailed,
  updateProjectName,
  updateProjectNameSuccess,
  updateProjectVisibility,
  updateProjectVisibilitySuccess,
  updatePinnedMetrics,
  updatePinnedMetricsSuccess,
  updatedPinnedMetricsFailure
} from "../actions/projectData";
import { clearSelectedGeounits, setSavingState, FindTool } from "../actions/districtDrawing";
import { updateCurrentState } from "../reducers/undoRedo";
import { IProject } from "../../shared/entities";
import { ProjectState, initialProjectState } from "./project";
import { resetProjectState } from "../actions/root";
import { projectsFetch } from "../actions/projects";
import { DistrictsGeoJSON, DynamicProjectData, SavingState, StaticProjectData } from "../types";
import { Resource } from "../resource";

import {
  allGeoUnitIndices,
  assignGeounitsToDistrict,
  showActionFailedToast,
  showResourceFailedToast
} from "../functions";
import {
  exportProjectCsv,
  exportProjectGeoJson,
  exportProjectShp,
  fetchProjectData,
  fetchProjectGeoJson,
  createProject,
  patchProject
} from "../api";
import { fetchAllStaticData } from "../s3";

function fetchGeoJsonForProject(project: IProject) {
  return () => {
    return fetchProjectGeoJson(project.id).then((geojson: DistrictsGeoJSON) => ({
      project,
      geojson
    }));
  };
}

export function getFindCoords(findTool: FindTool, geojson?: DistrictsGeoJSON) {
  const areAllUnassigned =
    geojson &&
    geojson.features.slice(1).every(district => district.geometry.coordinates.length === 0);
  return geojson && !areAllUnassigned
    ? findTool === FindTool.Unassigned
      ? geojson.features[0].geometry.coordinates
      : geojson.features
          .slice(1)
          .map(multipolygon => multipolygon.geometry.coordinates)
          .filter(coords => coords.length >= 2)
          .flat()
    : undefined;
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
          projectData: action.payload
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
            districtsDefinition: action.payload.project.districtsDefinition,
            lockedDistricts: action.payload.project.lockedDistricts
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
          projectData: action.payload
        },
        action.payload.statusCode && action.payload.statusCode >= 500
          ? Cmd.run(showResourceFailedToast)
          : Cmd.none
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
    // eslint-disable-next-line
    case getType(updateProjectVisibility): {
      if ("resource" in state.projectData) {
        const projectId = state.projectData.resource.project.id;
        const { geojson } = state.projectData.resource;
        return loop(
          {
            ...state,
            saving: "saving"
          },
          Cmd.run(
            () =>
              patchProject(projectId, { visibility: action.payload }).then(project => ({
                project,
                geojson
              })),
            {
              successActionCreator: updateProjectVisibilitySuccess,
              failActionCreator: updateProjectFailed
            }
          )
        );
      } else {
        return state;
      }
    }
    case getType(updateProjectVisibilitySuccess):
      return {
        ...state,
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
                      // Districts definition may be optionally specified in the action payload and
                      // is used if available. This is needed to go back/forward in time for a given
                      // state snapshot -- as opposed to just using the current districts definition
                      // -- for undo/redo to work correctly.
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
                // When updating districts definition after a save, we want to clear the selected
                // geounits since we're "done". However, when redoing/undoing changes with a
                // specific districts definition, we want to keep those geounits selected to allow
                // the user to potentially edit their selection or continuing undoing/redoing their
                // changes.
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
      const findCoords = getFindCoords(state.findTool, action.payload.geojson);

      return "resource" in state.projectData
        ? updateCurrentState(
            {
              ...state,
              projectData: {
                resource: action.payload
              },
              findIndex:
                state.findIndex !== undefined && findCoords && findCoords.length !== 0
                  ? Math.min(state.findIndex, findCoords.length - 1)
                  : undefined
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
    // eslint-disable-next-line
    case getType(updateDistrictLocks): {
      // eslint-disable-next-line
      if ("resource" in state.projectData) {
        const { id } = state.projectData.resource.project;
        const { geojson } = state.projectData.resource;
        return loop(
          {
            ...state,
            saving: "saving"
          },
          Cmd.run(
            () =>
              patchProject(id, { lockedDistricts: action.payload }).then(project => ({
                project,
                geojson
              })),
            {
              successActionCreator: updateDistrictLocksSuccess,
              failActionCreator: updateDistrictLocksFailure
            }
          )
        );
      } else {
        return state;
      }
    }
    case getType(updateDistrictLocksSuccess):
      return updateCurrentState(
        {
          ...state,
          saving: "saved",
          projectData: {
            resource: action.payload
          }
        },
        {
          lockedDistricts: action.payload.project.lockedDistricts
        }
      );
    case getType(updateDistrictLocksFailure):
      return loop(
        {
          ...state,
          saving: "failed"
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(updatePinnedMetrics): {
      if ("resource" in state.projectData) {
        const { id } = state.projectData.resource.project;
        const { geojson } = state.projectData.resource;
        return loop(
          {
            ...state,
            saving: "saving"
          },
          Cmd.run(
            () =>
              patchProject(id, { pinnedMetricFields: action.payload }).then(project => ({
                project,
                geojson
              })),
            {
              successActionCreator: updatePinnedMetricsSuccess,
              failActionCreator: updatedPinnedMetricsFailure
            }
          )
        );
      } else {
        return state;
      }
    }
    case getType(updatePinnedMetricsSuccess):
      return updateCurrentState(
        {
          ...state,
          saving: "saved",
          projectData: {
            resource: action.payload
          }
        },
        {
          pinnedMetricFields: action.payload.project.pinnedMetricFields
        }
      );
    case getType(updatedPinnedMetricsFailure):
      return loop(
        {
          ...state,
          saving: "failed"
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(duplicateProject): {
      return loop(
        state,
        Cmd.run(
          () => createProject({ ...action.payload, name: `Copy of ${action.payload.name}` }),
          {
            successActionCreator: duplicateProjectSuccess,
            failActionCreator: duplicateProjectFailure
          }
        )
      );
    }
    case getType(duplicateProjectSuccess):
      return loop(state, Cmd.action(projectsFetch()));
    case getType(duplicateProjectFailure):
      return loop(state, Cmd.run(showActionFailedToast));
    case getType(exportCsv):
      return loop(
        state,
        Cmd.run(exportProjectCsv, {
          failActionCreator: exportCsvFailure,
          args: [action.payload] as Parameters<typeof exportProjectCsv>
        })
      );
    case getType(exportCsvFailure):
      return loop(state, Cmd.run(showActionFailedToast));
    case getType(exportGeoJson):
      return loop(
        state,
        Cmd.run(exportProjectGeoJson, {
          failActionCreator: exportGeoJsonFailure,
          args: [action.payload] as Parameters<typeof exportProjectGeoJson>
        })
      );
    case getType(exportGeoJsonFailure):
      return loop(state, Cmd.run(showActionFailedToast));
    case getType(exportShp):
      return loop(
        state,
        Cmd.run(exportProjectShp, {
          failActionCreator: exportShpFailure,
          args: [action.payload] as Parameters<typeof exportProjectCsv>
        })
      );
    case getType(exportShpFailure):
      return loop(state, Cmd.run(showActionFailedToast));
    default:
      return state as never;
  }
};

export default projectDataReducer;
