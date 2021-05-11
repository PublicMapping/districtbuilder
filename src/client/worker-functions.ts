import stringify from "json-stable-stringify";
import memoize from "memoizee";

import { DemographicCounts, GeoUnits, IProject, IStaticMetadata, S3URI } from "../shared/entities";
import { StaticCounts } from "../client/types";
/* eslint import/no-webpack-loader-syntax: off */
import createWorker from "workerize-loader!./worker";
import * as WorkerType from "./worker";

const worker = createWorker<typeof WorkerType>();

// eslint-disable-next-line
function replacer(key: string, value: any): any {
  if (value instanceof Set) {
    // eslint-disable-next-line
    return [...value].sort();
  } else if (value instanceof Map) {
    return [...value.entries()].sort(([a], [b]) => (a === b ? 0 : a < b ? -1 : 1));
  } else {
    // eslint-disable-next-line
    return value;
  }
}

export const getTotalSelectedDemographics = memoize(
  async (
    staticMetadata: IStaticMetadata,
    regionURI: S3URI,
    selectedGeounits: GeoUnits
  ): Promise<StaticCounts> => {
    return worker.getTotalSelectedDemographics(staticMetadata, regionURI, selectedGeounits);
  },
  {
    normalizer: args => stringify([args[1], args[2]], { replacer }),
    primitive: true
  }
);

export const getSavedDistrictSelectedDemographics = memoize(
  async (
    project: IProject,
    staticMetadata: IStaticMetadata,
    selectedGeounits: GeoUnits
  ): Promise<readonly DemographicCounts[]> => {
    return worker.getSavedDistrictSelectedDemographics(
      project,
      staticMetadata,
      project.regionConfig.s3URI,
      selectedGeounits
    );
  },
  {
    normalizer: args => stringify([args[0], args[2]], { replacer }),
    primitive: true
  }
);
