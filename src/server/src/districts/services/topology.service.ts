import { Injectable, Logger } from "@nestjs/common";
import S3 from "aws-sdk/clients/s3";
import mapValues from "lodash/mapValues";
import { Topology } from "topojson-specification";

const BUCKET = "global-districtbuilder-dev-us-east-1";
const LAYERS = {
  pa: "pa/data/bg-lines.topojson"
};

@Injectable()
export class TopologyService {
  private readonly layers: { readonly [key: string]: Promise<Topology | void> };
  private readonly logger = new Logger(TopologyService.name);

  constructor() {
    const s3 = new S3();
    this.layers = mapValues(LAYERS, (url, key) =>
      s3
        .getObject({ Bucket: BUCKET, Key: url })
        .promise()
        .then(response => {
          const body = response.Body?.toString("utf8");
          if (body) {
            return JSON.parse(body) as Topology;
          }
        })
        .catch(err => {
          this.logger.error(`Unable to download topojson for ${key} at ${url}`);
        })
    );
  }

  public async get(key: string): Promise<Topology | void> {
    return key in this.layers ? this.layers[key] : Promise.resolve();
  }
}
