import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  organizationFetch,
  organizationFetchFailure,
  organizationFetchSuccess
} from "../actions/organization";

import { IOrganization } from "../../shared/entities";
import { fetchOrganization } from "../api";
import { showResourceFailedToast } from "../functions";
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
        {
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
        Cmd.run(showResourceFailedToast)
      );
    default:
      return state;
  }
};

export default organizationReducer;
