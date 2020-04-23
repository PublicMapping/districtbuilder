import { AuthAction } from "./actions/auth";
import { ProjectFormAction } from "./actions/projectForm";
import { ProjectsAction } from "./actions/projects";
import { RegionConfigAction } from "./actions/regionConfig";
import { UserAction } from "./actions/user";

export type Action =
  | AuthAction
  | UserAction
  | ProjectFormAction
  | RegionConfigAction
  | ProjectsAction;
