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
  organizationReset
} from "../actions/organization";

import { IOrganization } from "../../shared/entities";
import {
  fetchOrganization,
  exportOrganizationUsersCsv,
  exportOrganizationProjectsCsv
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
    default:
      return state;
  }
};

export default organizationReducer;
