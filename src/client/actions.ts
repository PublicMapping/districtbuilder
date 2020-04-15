import { AuthAction } from "./actions/auth";
import { UserAction } from "./actions/user";

export type Action = AuthAction | UserAction;
