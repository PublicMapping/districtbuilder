import { createAction } from "typesafe-actions";
import { ElectionYear } from "../types";

export const toggleLimitDrawingToWithinCounty = createAction("Limit drawing to within county")();

export const setElectionYear = createAction("Set election year for tooltip data")<ElectionYear>();
