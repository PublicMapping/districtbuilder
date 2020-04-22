import { AuthAction } from "./actions/auth";
import { ProjectFormAction } from "./actions/projectForm";
import { UserAction } from "./actions/user";

export type Action = AuthAction | UserAction | ProjectFormAction;
