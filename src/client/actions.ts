import { AuthAction } from "./actions/auth";
import { UsersAction } from "./actions/users";

export type Action = AuthAction | UsersAction;
