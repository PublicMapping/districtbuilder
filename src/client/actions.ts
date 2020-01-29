import { UsersAction } from "./actions/users";

export type Action = UsersAction;

export type DispatchFunction = (action: Action) => void;
