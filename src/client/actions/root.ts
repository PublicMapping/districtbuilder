import { createAction } from "typesafe-actions";

export const resetState = createAction("Reset all state")();

export const resetProjectState = createAction("Reset project screen state")();
