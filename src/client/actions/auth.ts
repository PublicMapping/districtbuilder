import { createAction } from "typesafe-actions";
import { JWT, Login } from "../../shared/entities";

export const authenticate = createAction("Authenticate")<Login>();
export const authenticateSuccess = createAction("Authenticate success")<JWT>();
export const authenticateFailure = createAction("Authenticate failure")<string>();
