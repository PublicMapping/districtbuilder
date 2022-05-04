import { createAction } from "typesafe-actions";
import { ElectionYear } from "../types";
import { GroupTotal } from "@districtbuilder/shared/entities";

export const toggleLimitDrawingToWithinCounty = createAction("Limit drawing to within county")();

export const setElectionYear = createAction("Set election year for tooltip data")<ElectionYear>();

export const setPopulationKey = createAction("Set field to use for population")<GroupTotal>();
