import { ActionType } from "typesafe-actions";

import * as authActions from "./actions/auth";
import * as districtDrawingActions from "./actions/districtDrawing";
import * as organizationActions from "./actions/organization";
import * as organizationJoinActions from "./actions/organizationJoin";
import * as organizationProjectActions from "./actions/organizationProjects";
import * as projectDataActions from "./actions/projectData";
import * as projectOptionsActions from "./actions/projectOptions";
import * as projectsActions from "./actions/projects";
import * as regionConfigActions from "./actions/regionConfig";
import * as rootActions from "./actions/root";
import * as userActions from "./actions/user";

export type AuthAction = ActionType<typeof authActions>;
export type DistrictDrawingAction = ActionType<typeof districtDrawingActions>;
export type OrganizationAction = ActionType<typeof organizationActions>;
export type OrganizationJoinAction = ActionType<typeof organizationJoinActions>;
export type OrganizationProjectsAction = ActionType<typeof organizationProjectActions>;
export type ProjectDataAction = ActionType<typeof projectDataActions>;
export type ProjectOptionsAction = ActionType<typeof projectOptionsActions>;
export type ProjectsAction = ActionType<typeof projectsActions>;
export type RegionConfigAction = ActionType<typeof regionConfigActions>;
export type RootAction = ActionType<typeof rootActions>;
export type UserAction = ActionType<typeof userActions>;

export type Action =
  | AuthAction
  | DistrictDrawingAction
  | OrganizationAction
  | OrganizationProjectsAction
  | OrganizationJoinAction
  | ProjectDataAction
  | ProjectOptionsAction
  | ProjectsAction
  | RegionConfigAction
  | RootAction
  | UserAction;
