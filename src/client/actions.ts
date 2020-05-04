import { ActionType } from "typesafe-actions";

import * as authActions from "./actions/auth";
import * as projectsActions from "./actions/projects";
import { RegionConfigAction } from "./actions/regionConfig";
import { UserAction } from "./actions/user";

export type AuthAction = ActionType<typeof authActions>;
export type ProjectsAction = ActionType<typeof projectsActions>;

export type Action = AuthAction | UserAction | RegionConfigAction | ProjectsAction;
