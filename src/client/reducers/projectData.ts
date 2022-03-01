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
  updatedPinnedMetricsFailure,
  clearDuplicationState,
  toggleReferenceLayersModal,
  projectReferenceLayersFetch,
  projectReferenceLayersFetchSuccess,
  projectReferenceLayersFetchFailure,
  referenceLayerUpdate,
  referenceLayerUpdateSuccess,
  referenceLayerUpdateFailure,
  referenceLayerDelete,
  referenceLayerDeleteSuccess,
  referenceLayerDeleteFailure,
  setDeleteReferenceLayer,
  toggleProjectDetailsModal,
  updateProjectDetailsSuccess
} from "../actions/projectData";
import { clearSelectedGeounits, setSavingState, FindTool } from "../actions/districtDrawing";
import { updateCurrentState } from "../reducers/undoRedo";
import { IProject, IReferenceLayer } from "../../shared/entities";
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
import {
  exportProjectCsv,
  exportProjectGeoJson,
  exportProjectShp,
  fetchProjectData,
  fetchProjectReferenceLayers,
  patchReferenceLayer,
  fetchProjectGeoJson,
  patchProject,
  copyProject,
  deleteReferenceLayer
} from "../api";
import { fetchAllStaticData } from "../s3";
import { toast } from "react-toastify";

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
  readonly saving: SavingState;
  readonly referenceLayers: Resource<readonly IReferenceLayer[]>;
  readonly showReferenceLayersModal: boolean;
  readonly showProjectDetailsModal: boolean;
  readonly duplicatedProject: IProject | null;
  readonly deleteReferenceLayer?: IReferenceLayer;
};

export const initialProjectDataState = {
  projectData: {
    isPending: false
  },
  staticData: {
    isPending: false
  },
  referenceLayers: { isPending: false },
  projectNameSaving: "saved",
  saving: "unsaved",
  showReferenceLayersModal: false,
  showProjectDetailsModal: false,
  duplicatedProject: null
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
            lockedDistricts: action.payload.project.lockedDistricts,
            pinnedMetricFields: action.payload.project.pinnedMetricFields
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
    case getType(projectReferenceLayersFetch):
      return loop(
        {
          ...state,
          referenceLayers: { ...state.referenceLayers, isPending: true }
        },
        Cmd.run(fetchProjectReferenceLayers, {
          successActionCreator: projectReferenceLayersFetchSuccess,
          failActionCreator: projectReferenceLayersFetchFailure,
          args: [action.payload] as Parameters<typeof fetchProjectReferenceLayers>
        })
      );
    case getType(projectReferenceLayersFetchSuccess):
      return {
        ...state,
        referenceLayers: {
          resource: action.payload
        }
      };
    case getType(projectReferenceLayersFetchFailure):
      return loop(
        {
          ...state,
          referenceLayers: action.payload
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(referenceLayerUpdate):
      return loop(
        { ...state, referenceLayers: { ...state.referenceLayers, isPending: true } },
        Cmd.run(patchReferenceLayer, {
          successActionCreator: referenceLayerUpdateSuccess,
          failActionCreator: referenceLayerUpdateFailure,
          args: [action.payload.id, action.payload.layer_color] as Parameters<
            typeof patchReferenceLayer
          >
        })
      );
    case getType(referenceLayerUpdateSuccess):
      return {
        ...state,
        referenceLayers: {
          resource:
            "resource" in state.referenceLayers
              ? state.referenceLayers.resource.map(layer => {
                  if (layer.id === action.payload.id) {
                    return {
                      ...layer,
                      layer_color: action.payload.layer_color
                    };
                  } else {
                    return layer;
                  }
                })
              : []
        }
      };
    case getType(referenceLayerUpdateFailure):
      return loop(
        {
          ...state,
          referenceLayer: action.payload
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(referenceLayerDelete):
      return loop(
        {
          ...state,
          referenceLayers: {
            resource:
              "resource" in state.referenceLayers ? state.referenceLayers.resource : undefined,
            isPending: true
          }
        },
        Cmd.run(deleteReferenceLayer, {
          successActionCreator: referenceLayerDeleteSuccess,
          failActionCreator: referenceLayerDeleteFailure,
          args: [action.payload] as Parameters<typeof deleteReferenceLayer>
        })
      );
    case getType(referenceLayerDeleteSuccess):
      return {
        ...state,
        deleteReferenceLayer: undefined,
        showReferenceLayers: new Set(
          [...state.showReferenceLayers].filter(id => id !== action.payload)
        ),
        referenceLayers: {
          resource:
            "resource" in state.referenceLayers
              ? state.referenceLayers.resource.filter(layer => layer.id !== action.payload)
              : []
        }
      };
    case getType(referenceLayerDeleteFailure):
      return loop(
        {
          ...state,
          referenceLayers: action.payload
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(setDeleteReferenceLayer):
      return {
        ...state,
        deleteReferenceLayer: action.payload
      };
    case getType(staticDataFetchSuccess):
      return {
        ...state,
        staticData: {
          resource: action.payload
        }
      };
    case getType(toggleReferenceLayersModal):
      return {
        ...state,
        showReferenceLayersModal: !state.showReferenceLayersModal
      };
    case getType(toggleProjectDetailsModal):
      return {
        ...state,
        showProjectDetailsModal: !state.showProjectDetailsModal
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
    case getType(updateProjectDetailsSuccess):
      return {
        ...state,
        saving: "saved",
        showProjectDetailsModal: false,
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
        const { pinnedMetricFields, isReadOnly } = action.payload;
        const updatedState = updateCurrentState(state, { pinnedMetricFields });
        return isReadOnly
          ? updatedState
          : // We update the pinned metrics right away, assuming it will succeed, to keep the UI snappy
            loop(
              {
                ...updatedState,
                saving: "saving"
              },
              Cmd.run(
                () =>
                  patchProject(id, { pinnedMetricFields }).then(project => ({
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
      // We already updated the pinned metrics, and can't rely on the order returned by the server
      // to be consistent with our save order, so we purposefully don't update the pinned metrics here
      return {
        ...state,
        saving: "saved",
        projectData: {
          resource: action.payload
        }
      };
    case getType(updatedPinnedMetricsFailure):
      return loop(
        {
          ...state,
          saving: "failed"
        },
        Cmd.run(() => toast.error("Unable to save pinned metrics."))
      );
    case getType(duplicateProject): {
      return loop(
        {
          ...state,
          saving: "saving",
          duplicatedProject: null
        },
        Cmd.run(() => copyProject(action.payload.id), {
          successActionCreator: duplicateProjectSuccess,
          failActionCreator: duplicateProjectFailure
        })
      );
    }
    case getType(duplicateProjectSuccess):
      return {
        ...state,
        saving: "saved",
        duplicatedProject: action.payload
      };
    case getType(duplicateProjectFailure):
      return loop(
        {
          ...state,
          saving: "failed",
          duplicatedProject: null
        },
        Cmd.run(showActionFailedToast)
      );
    case getType(clearDuplicationState):
      return {
        ...state,
        saving: "unsaved",
        duplicatedProject: null
      };
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
