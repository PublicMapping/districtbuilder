import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";

import { IProjectTemplateWithProjects } from "../../shared/entities";
import {
  fetchOrganizationFeaturedProjects,
  fetchOrganizationProjects,
  saveProjectFeatured,
  exportOrganizationProjectsCsv
} from "../api";
import { showResourceFailedToast, showActionFailedToast } from "../functions";
import { Resource } from "../resource";
import {
  organizationProjectsFetch,
  organizationProjectsFetchSuccess,
  organizationProjectsFetchFailure,
  organizationFeaturedProjectsFetch,
  organizationFeaturedProjectsFetchSuccess,
  organizationFeaturedProjectsFetchFailure,
  toggleProjectFeatured,
  toggleProjectFeaturedSuccess,
  toggleProjectFeaturedFailure,
  exportProjectsFailure,
  exportProjects
} from "../actions/organizationProjects";

export interface OrganizationProjectsState {
  readonly projectTemplates: Resource<readonly IProjectTemplateWithProjects[]>;
  readonly featuredProjects: Resource<readonly IProjectTemplateWithProjects[]>;
}

export const initialState = {
  projectTemplates: { isPending: false },
  featuredProjects: { isPending: false }
};

const organizationProjectsReducer: LoopReducer<OrganizationProjectsState, Action> = (
  state: OrganizationProjectsState = initialState,
  action: Action
): OrganizationProjectsState | Loop<OrganizationProjectsState, Action> => {
  switch (action.type) {
    case getType(organizationProjectsFetch):
      return loop(
        {
          ...state,
          projectTemplates: { isPending: true }
        },
        Cmd.run(fetchOrganizationProjects, {
          successActionCreator: organizationProjectsFetchSuccess,
          failActionCreator: organizationProjectsFetchFailure,
          args: [action.payload] as Parameters<typeof fetchOrganizationProjects>
        })
      );
    case getType(organizationProjectsFetchSuccess):
      return {
        ...state,
        projectTemplates: { resource: action.payload }
      };
    case getType(organizationProjectsFetchFailure):
      return loop(
        {
          ...state,
          // error message saved under projectTemplates.errorMessage
          projectTemplates: action.payload
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(organizationFeaturedProjectsFetch):
      return loop(
        {
          ...state,
          featuredProjects: { isPending: true }
        },
        Cmd.run(fetchOrganizationFeaturedProjects, {
          successActionCreator: organizationFeaturedProjectsFetchSuccess,
          failActionCreator: organizationFeaturedProjectsFetchFailure,
          args: [action.payload] as Parameters<typeof fetchOrganizationFeaturedProjects>
        })
      );
    case getType(organizationFeaturedProjectsFetchSuccess):
      return {
        ...state,
        featuredProjects: { resource: action.payload }
      };
    case getType(organizationFeaturedProjectsFetchFailure):
      return loop(
        {
          ...state,
          // error message saved under projectTemplates.errorMessage
          projectTemplates: action.payload
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(toggleProjectFeatured): {
      return loop(
        {
          ...state
        },
        Cmd.run(
          () =>
            saveProjectFeatured(action.payload.project).then(() => {
              return { organization: action.payload.organization };
            }),
          {
            successActionCreator: toggleProjectFeaturedSuccess,
            failActionCreator: toggleProjectFeaturedFailure
          }
        )
      );
    }
    case getType(toggleProjectFeaturedSuccess):
      return loop(
        {
          ...state,
          featuredProjects: { isPending: false }
        },
        Cmd.action(organizationProjectsFetch(action.payload.organization))
      );
    case getType(toggleProjectFeaturedFailure):
      return loop(
        {
          ...state,
          // error message saved under projectTemplates.errorMessage
          featuredProjects: action.payload
        },
        Cmd.run(showResourceFailedToast)
      );
    case getType(exportProjects):
      return loop(
        state,
        Cmd.run(exportOrganizationProjectsCsv, {
          failActionCreator: exportProjectsFailure,
          args: [action.payload] as Parameters<typeof exportOrganizationProjectsCsv>
        })
      );
    case getType(exportProjectsFailure):
      return loop(state, Cmd.run(showActionFailedToast));
    default:
      return state;
  }
};

export default organizationProjectsReducer;
