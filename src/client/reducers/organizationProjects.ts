import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";


import { IProjectTemplate } from "../../shared/entities";
import { fetchOrganizationProjects } from "../api";
import { showResourceFailedToast } from "../functions";
import { Resource } from "../resource";
import { organizationProjectsFetch, organizationProjectsFetchSuccess, organizationProjectsFetchFailure } from "../actions/organizationProjects";

export type OrganizationProjectsState = Resource<IProjectTemplate[]>;

export const initialState = {
  isPending: false
};

const organizationProjectsReducer: LoopReducer<OrganizationProjectsState, Action> = (
  state: OrganizationProjectsState = initialState,
  action: Action
): OrganizationProjectsState | Loop<OrganizationProjectsState, Action> => {
  switch (action.type) {
    case getType(organizationProjectsFetch):
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchOrganizationProjects, {
          successActionCreator: organizationProjectsFetchSuccess,
          failActionCreator: organizationProjectsFetchFailure,
          args: [action.payload] as Parameters<typeof fetchOrganizationProjects>
        })
      );
    case getType(organizationProjectsFetchSuccess):
      return {
        resource: action.payload
      };
    case getType(organizationProjectsFetchFailure):
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

export default organizationProjectsReducer;
