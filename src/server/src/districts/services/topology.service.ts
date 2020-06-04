import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import S3 from "aws-sdk/clients/s3";
import { Topology } from "topojson-specification";
import { Repository } from "typeorm";

import { S3URI } from "../../../../shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { GeoUnitTopology } from "../entities/geo-unit-topology.entity";

@Injectable()
export class TopologyService {
  private layers: {
    readonly [s3URI: string]: Promise<GeoUnitTopology | void>;
  } = {};
  private readonly logger = new Logger(TopologyService.name);
  private s3 = new S3();
  constructor(@InjectRepository(RegionConfig) repo: Repository<RegionConfig>) {
    repo.find().then(regionConfigs => {
      this.layers = regionConfigs
        .map(regionConfig => regionConfig.s3URI)
        .reduce(
          (layers, s3URI) => ({
            ...layers,
            [s3URI]: this.fetchLayer(s3URI)
          }),
          {}
        );
    });
  }

  public async get(s3URI: S3URI): Promise<GeoUnitTopology | void> {
    return s3URI in this.layers
      ? this.layers[s3URI]
      : this.fetchLayer(s3URI).catch(err => {
          this.logger.error(err);
        });
  }

  private async fetchLayer(s3URI: S3URI): Promise<GeoUnitTopology | void> {
    const url = new URL(s3URI);
    const bucket = url.hostname;
    const pathWithoutLeadingSlash = url.pathname.substring(1);
    const topojsonKey = `${pathWithoutLeadingSlash}topo.json`;
    const staticMetadataKey = `${pathWithoutLeadingSlash}static-metadata.json`;
    return Promise.all([
      this.s3.getObject({ Bucket: bucket, Key: topojsonKey }).promise(),
      this.s3.getObject({ Bucket: bucket, Key: staticMetadataKey }).promise()
    ])
      .then(([topojsonResponse, staticMetadataResponse]) => {
        this.logger.debug(`downloaded data for s3URI ${s3URI}`);
        const staticMetadataBody = staticMetadataResponse.Body?.toString("utf8");
        const topojsonBody = topojsonResponse.Body?.toString("utf8");
        if (staticMetadataBody && topojsonBody) {
          const staticMetadata = JSON.parse(staticMetadataBody);
          const geoLevelHierarchy = staticMetadata.geoLevelHierarchy as string[];
          if (!geoLevelHierarchy) {
            this.logger.error(
              `geoLevelHierarchy missing from static metadata for bucket ${bucket} and key ${staticMetadataKey}`
            );
          }
          const topology = JSON.parse(topojsonBody) as Topology;
          return new GeoUnitTopology(topology, { groups: geoLevelHierarchy.reverse() });
        } else {
          this.logger.error("Invalid TopoJSON or metadata bodies");
        }
      })
      .catch(err =>
        this.logger.error(
          `Unable to download static files from bucket ${bucket} with keys ${topojsonKey} and ${staticMetadataKey}: ${err}`
        )
      );
  }
}
