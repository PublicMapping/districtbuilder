import { Injectable, Logger } from "@nestjs/common";
import S3 from "aws-sdk/clients/s3";
import { Topology } from "topojson-specification";

import { S3URI } from "../../../../shared/entities";
import { GeoUnitTopology } from "../entities/geo-unit-topology.entity";

@Injectable()
export class TopologyService {
  private layers: {
    [s3URI: string]: GeoUnitTopology;
  } = {};
  private readonly logger = new Logger(TopologyService.name);
  private s3 = new S3();

  public async get(s3URI: S3URI): Promise<GeoUnitTopology> {
    return s3URI in this.layers
      ? Promise.resolve(this.layers[s3URI])
      : new Promise((resolve, reject) => {
          this.fetchLayer(s3URI)
            .then(geoUnitTopology => {
              // tslint:disable-next-line no-object-mutation
              this.layers[s3URI] = geoUnitTopology;
              resolve(geoUnitTopology);
            })
            .catch(err => {
              this.logger.error(err);
              reject("Error retrieving topology");
            });
        });
  }

  private async fetchLayer(s3URI: S3URI): Promise<GeoUnitTopology> {
    const url = new URL(s3URI);
    const bucket = url.hostname;
    const pathWithoutLeadingSlash = url.pathname.substring(1);
    const topojsonKey = `${pathWithoutLeadingSlash}topo.json`;
    const staticMetadataKey = `${pathWithoutLeadingSlash}static-metadata.json`;
    return new Promise((resolve, reject) => {
      Promise.all([
        this.s3.getObject({ Bucket: bucket, Key: topojsonKey }).promise(),
        this.s3.getObject({ Bucket: bucket, Key: staticMetadataKey }).promise()
      ])
        .then(([topojsonResponse, staticMetadataResponse]) => {
          const staticMetadataBody = staticMetadataResponse.Body?.toString("utf8");
          const topojsonBody = topojsonResponse.Body?.toString("utf8");
          if (staticMetadataBody && topojsonBody) {
            const staticMetadata = JSON.parse(staticMetadataBody);
            const geoLevelHierarchy = staticMetadata.geoLevelHierarchy as string[];
            if (!geoLevelHierarchy) {
              reject(
                `geoLevelHierarchy missing from static metadata for bucket ${bucket} and key ${staticMetadataKey}`
              );
            }
            const topology = JSON.parse(topojsonBody) as Topology;
            resolve(new GeoUnitTopology(topology, { groups: geoLevelHierarchy }));
          } else {
            reject("Invalid TopoJSON or metadata bodies");
          }
        })
        .catch(err =>
          reject(
            `Unable to download static files from bucket ${bucket} with keys ${topojsonKey} and ${staticMetadataKey}: ${err}`
          )
        );
    });
  }
}
