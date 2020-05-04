import { ActionType } from "typesafe-actions";

import { AuthAction } from "./actions/auth";
import * as projectsActions from "./actions/projects";
import { RegionConfigAction } from "./actions/regionConfig";
import { UserAction } from "./actions/user";

export type ProjectsAction = ActionType<typeof projectsActions>;

export type Action = AuthAction | UserAction | RegionConfigAction | ProjectsAction;
