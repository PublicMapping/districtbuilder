import { ActionType } from "typesafe-actions";

import * as projectActions from "./actions/project";
import * as projectsActions from "./actions/projects";
import * as regionConfigActions from "./actions/regionConfig";
import * as staticMetadataActions from "./actions/staticMetadata";
import * as userActions from "./actions/user";

export type ProjectAction = ActionType<typeof projectActions>;
export type ProjectsAction = ActionType<typeof projectsActions>;
export type RegionConfigAction = ActionType<typeof regionConfigActions>;
export type StaticMetadataAction = ActionType<typeof staticMetadataActions>;
export type UserAction = ActionType<typeof userActions>;

export type Action =
  | UserAction
  | RegionConfigAction
  | StaticMetadataAction
  | ProjectAction
  | ProjectsAction;
