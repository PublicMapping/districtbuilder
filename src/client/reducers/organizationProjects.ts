import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";

import { IProject, IProjectTemplateWithProjects } from "../../shared/entities";
import { fetchOrganizationProjects, saveProjectFeatured } from "../api";
import { showResourceFailedToast } from "../functions";
import { Resource } from "../resource";
import {
  organizationProjectsFetch,
  organizationProjectsFetchSuccess,
  organizationProjectsFetchFailure,
  toggleProjectFeatured,
  toggleProjectFeaturedSuccess,
  toggleProjectFeaturedFailure
} from "../actions/organizationProjects";

export interface OrganizationProjectsState {
  readonly projectTemplates: Resource<readonly IProjectTemplateWithProjects[]>;
  readonly featuredProjects: Resource<readonly IProject[]>;
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
    case getType(toggleProjectFeatured): {
      return loop(
        {
          ...state,
          featuredProjects: { isPending: true }
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
    default:
      return state;
  }
};

export default organizationProjectsReducer;
