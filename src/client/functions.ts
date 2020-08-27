import memoize from "memoizee";

import {
  getDemographics as getDemographicsBase,
  getTotalSelectedDemographics as getTotalSelectedDemographicsBase
} from "../shared/functions";

// TODO: merge this module with shared/functions once the ability to import
// third party dependencies into the shared module is fixed

export const getDemographics = memoize(getDemographicsBase, {
  normalizer: args => JSON.stringify([[...args[0]].sort(), args[1]]),
  primitive: true
});
export const getTotalSelectedDemographics = memoize(getTotalSelectedDemographicsBase, {
  normalizer: args => JSON.stringify([args[0], [...args[3]].sort()]),
  primitive: true
});
