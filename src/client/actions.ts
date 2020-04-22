import { AuthAction } from "./actions/auth";
import { ProjectFormAction } from "./actions/projectForm";
import { UserAction } from "./actions/user";
import { RegionConfigAction } from "./actions/regionConfig";

export type Action = AuthAction | UserAction | ProjectFormAction | RegionConfigAction;
