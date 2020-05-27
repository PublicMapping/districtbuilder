import { ActionType } from "typesafe-actions";

import * as authActions from "./actions/auth";
import * as projectDataActions from "./actions/projectData";
import * as projectsActions from "./actions/projects";
import * as regionConfigActions from "./actions/regionConfig";
import * as userActions from "./actions/user";

export type AuthAction = ActionType<typeof authActions>;
export type ProjectDataAction = ActionType<typeof projectDataActions>;
export type ProjectsAction = ActionType<typeof projectsActions>;
export type RegionConfigAction = ActionType<typeof regionConfigActions>;
export type UserAction = ActionType<typeof userActions>;

export type Action =
  | AuthAction
  | UserAction
  | RegionConfigAction
  | ProjectDataAction
  | ProjectsAction;
