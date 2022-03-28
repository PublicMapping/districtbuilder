import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  organizationFetch,
  organizationFetchFailure,
  organizationFetchSuccess,
  exportOrgUsers,
  exportOrgUsersFailure,
  exportProjects,
  exportProjectsFailure,
  organizationReset,
  setArchiveTemplate,
  archiveTemplate,
  archiveTemplateSuccess,
  archiveTemplateFailure
} from "../actions/organization";

import { IOrganization } from "../../shared/entities";
import {
  fetchOrganization,
  exportOrganizationUsersCsv,
  exportOrganizationProjectsCsv,
  archiveProjectTemplate
} from "../api";
import { showResourceFailedToast, showActionFailedToast } from "../functions";
import { Resource } from "../resource";

export type OrganizationState = Resource<IOrganization>;

export const initialState = {
  isPending: false
};

const organizationReducer: LoopReducer<OrganizationState, Action> = (
  state: OrganizationState = initialState,
  action: Action
): OrganizationState | Loop<OrganizationState, Action> => {
  switch (action.type) {
    case getType(organizationFetch):
      return loop(
        "resource" in state
          ? { resource: state.resource, isPending: true }
          : {
              isPending: true
            },
        Cmd.run(fetchOrganization, {
          successActionCreator: organizationFetchSuccess,
          failActionCreator: organizationFetchFailure,
          args: [action.payload] as Parameters<typeof fetchOrganization>
        })
      );
    case getType(organizationFetchSuccess):
      return {
        resource: action.payload
      };
    case getType(organizationFetchFailure):
      return loop(
        {
          ...action.payload
        },
        action.payload.statusCode && action.payload.statusCode >= 500
          ? Cmd.run(showResourceFailedToast)
          : Cmd.none
      );
    case getType(organizationReset):
      return {
        isPending: false
      };
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
    case getType(exportOrgUsers):
      return loop(
        state,
        Cmd.run(exportOrganizationUsersCsv, {
          failActionCreator: exportOrgUsersFailure,
          args: [action.payload] as Parameters<typeof exportOrganizationUsersCsv>
        })
      );
    case getType(exportOrgUsersFailure):
      return loop(state, Cmd.run(showActionFailedToast));
    case getType(setArchiveTemplate):
      return "resource" in state
        ? { resource: { ...state.resource, deleteTemplate: action.payload } }
        : {
            isPending: false
          };
    case getType(archiveTemplate):
      return loop(
        "resource" in state
          ? {
              resource: { ...state.resource, archiveTemplatePending: true }
            }
          : {
              isPending: false
            },
        Cmd.run(archiveProjectTemplate, {
          successActionCreator: archiveTemplateSuccess,
          failActionCreator: archiveTemplateFailure,
          args: [action.payload.slug, action.payload.id] as Parameters<
            typeof archiveProjectTemplate
          >
        })
      );
    case getType(archiveTemplateSuccess):
      return "resource" in state
        ? {
            resource: {
              ...state.resource,
              deleteTemplate: undefined,
              archiveTemplatePending: false,
              projectTemplates: state.resource.projectTemplates.filter(
                template => template.id !== action.payload
              )
            }
          }
        : {
            isPending: false
          };
    case getType(archiveTemplateFailure):
      return loop(
        "resource" in state
          ? {
              resource: { ...state.resource, archiveTemplatePending: false }
            }
          : {
              isPending: false
            },
        Cmd.run(showResourceFailedToast)
      );
    default:
      return state;
  }
};

export default organizationReducer;
