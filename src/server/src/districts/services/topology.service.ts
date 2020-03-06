import { Injectable, Logger } from "@nestjs/common";
import S3 from "aws-sdk/clients/s3";
import mapValues from "lodash/mapValues";
import { Topology } from "topojson-specification";

import {
  GeoUnitDefinition,
  GeoUnitTopology
} from "../entities/geo-unit-topology.entity";

interface Layer {
  url: string;
  definition: GeoUnitDefinition;
}

const BUCKET = "global-districtbuilder-dev-us-east-1";
const LAYERS: { [key: string]: Layer } = {
  de: {
    url: "de/data/DE.topojson",
    definition: {
      groups: ["county", "tract", "block"]
    }
  },
  pa: {
    url: "pa/data/bg-lines.topojson",
    definition: {
      groups: ["bg-lines"]
    }
  }
};

@Injectable()
export class TopologyService {
  private readonly layers: {
    readonly [key: string]: Promise<GeoUnitTopology | void>;
  };
  private readonly logger = new Logger(TopologyService.name);

  constructor() {
    const s3 = new S3();
    this.layers = mapValues(LAYERS, ({ url, definition }, key) =>
      s3
        .getObject({ Bucket: BUCKET, Key: url })
        .promise()
        .then(response => {
          const body = response.Body?.toString("utf8");
          if (body) {
            const topology = JSON.parse(body) as Topology;
            return new GeoUnitTopology(topology, definition);
          }
        })
        .catch(err => {
          this.logger.error(err);
          this.logger.error(`Unable to download topojson for ${key} at ${url}`);
        })
    );
  }

  public async get(key: string): Promise<GeoUnitTopology | void> {
    return key in this.layers ? this.layers[key] : Promise.resolve();
  }
}
