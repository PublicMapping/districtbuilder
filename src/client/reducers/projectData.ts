import { FeatureCollection, MultiPolygon } from "geojson";
import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  updateDistrictsDefinition,
  updateDistrictsDefinitionFailure,
  updateDistrictsDefinitionSuccess,
  projectDataFetch,
  projectDataFetchFailure,
  projectDataFetchSuccess,
  staticDataFetchFailure,
  staticDataFetchSuccess
} from "../actions/projectData";
import { clearSelectedGeounits } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";

import { DynamicProjectData, StaticProjectData } from "../types";
import { allGeoUnitIndices, assignGeounitsToDistrict } from "../functions";
import { fetchProjectData, updateProject } from "../api";
import { Resource } from "../resource";
import { fetchAllStaticData } from "../s3";

export function isProjectDataLoading(projectDataState: ProjectDataState): boolean {
  return Object.values(projectDataState).some(
    resource => "isPending" in resource && resource.isPending
  );
}

export type ProjectDataState = {
  projectData: Resource<DynamicProjectData>;
  staticData: Resource<StaticProjectData>;
};

export const initialState = {
  projectData: {
    isPending: false
  },
  staticData: {
    isPending: false
  }
};

const projectDataReducer: LoopReducer<ProjectDataState, Action> = (
  state: ProjectDataState = initialState,
  action: Action
): ProjectDataState | Loop<ProjectDataState, Action> => {
  switch (action.type) {
    case getType(resetProjectState):
      return initialState;
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
        Cmd.list<Action>([
          Cmd.action(clearSelectedGeounits()),
          Cmd.run(fetchAllStaticData, {
            successActionCreator: staticDataFetchSuccess,
            failActionCreator: staticDataFetchFailure,
            args: [action.payload.project.regionConfig.s3URI] as Parameters<
              typeof fetchAllStaticData
            >
          })
        ])
      );
    case getType(projectDataFetchFailure):
      return {
        ...state,
        projectData: {
          errorMessage: action.payload
        }
      };
    case getType(staticDataFetchSuccess):
      return {
        ...state,
        staticData: {
          resource: action.payload
        }
      };
    case getType(staticDataFetchFailure):
      return {
        ...state,
        staticData: {
          errorMessage: action.payload
        }
      };
    case getType(updateDistrictsDefinition):
      return "resource" in state.projectData && "resource" in state.staticData
        ? loop(
            state,
            Cmd.run(updateProject, {
              successActionCreator: updateDistrictsDefinitionSuccess,
              failActionCreator: updateDistrictsDefinitionFailure,
              args: [
                state.projectData.resource.project.id,
                assignGeounitsToDistrict(
                  state.projectData.resource.project.districtsDefinition,
                  state.staticData.resource.geoUnitHierarchy,
                  allGeoUnitIndices(action.payload.selectedGeounits),
                  action.payload.selectedDistrictId
                )
              ] as Parameters<typeof updateProject>
            })
          )
        : state;
    case getType(updateDistrictsDefinitionSuccess):
      return loop(
        {
          ...state,
          projectData: {
            resource: action.payload
          }
        },
        Cmd.action(clearSelectedGeounits())
      );
    case getType(updateDistrictsDefinitionFailure):
      // TODO (#188): implement a status area to display errors for this and other things
      // eslint-disable-next-line
      console.log("Error patching districts definition: ", action.payload);
      return state;
    default:
      return state as never;
  }
};

export default projectDataReducer;
