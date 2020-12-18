import { HttpService, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import S3, { GetObjectRequest } from "aws-sdk/clients/s3";
import { Topology } from "topojson-specification";
import { Repository } from "typeorm";

import { UintArrays, IStaticFile, IStaticMetadata, S3URI } from "../../../../shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { GeoUnitTopology } from "../entities/geo-unit-topology.entity";

function s3Options(path: S3URI, fileName: string): GetObjectRequest {
  const url = new URL(path);
  const pathWithoutLeadingSlash = url.pathname.substring(1);
  const options = { Bucket: url.hostname, Key: `${pathWithoutLeadingSlash}${fileName}` };
  return options;
}

interface Layers {
  readonly [s3URI: string]: Promise<GeoUnitTopology | void>;
}

@Injectable()
export class TopologyService {
  private _layers?: Layers = undefined;
  private readonly logger = new Logger(TopologyService.name);
  private s3 = new S3();

  constructor(@InjectRepository(RegionConfig) repo: Repository<RegionConfig>) {
    void repo.find().then(regionConfigs => {
      this._layers = regionConfigs
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

  public layers(): Readonly<Layers> | undefined {
    return this._layers && Object.freeze(this._layers);
  }

  public async get(s3URI: S3URI): Promise<GeoUnitTopology | void> {
    if (!this._layers) {
      return;
    }
    if (!(s3URI in this._layers)) {
      // If we encounter a new layer (i.e. one added after the service has started),
      // then store the results in the `_layers` object.
      // @ts-ignore
      // eslint-disable-next-line functional/immutable-data
      this._layers[s3URI] = this.fetchLayer(s3URI).catch(err => {
        this.logger.error(err);
      });
    }
    return this._layers[s3URI];
  }

  private async fetchLayer(s3URI: S3URI): Promise<GeoUnitTopology | void> {
    try {
      const [topojsonResponse, staticMetadataResponse] = await Promise.all([
        this.s3.getObject(s3Options(s3URI, "topo.json")).promise(),
        this.s3.getObject(s3Options(s3URI, "static-metadata.json")).promise()
      ]);

      const staticMetadataBody = staticMetadataResponse.Body?.toString("utf8");
      const topojsonBody = topojsonResponse.Body?.toString("utf8");
      if (staticMetadataBody && topojsonBody) {
        const staticMetadata = JSON.parse(staticMetadataBody) as IStaticMetadata;
        const geoLevelHierarchy = staticMetadata.geoLevelHierarchy.map(gl => gl.id);
        if (!geoLevelHierarchy) {
          this.logger.error(`geoLevelHierarchy missing from static metadata for ${s3URI}`);
        }
        const topology = JSON.parse(topojsonBody) as Topology;
        const [demographics, geoLevels] = await Promise.all([
          this.fetchStaticFiles(s3URI, staticMetadata.demographics),
          this.fetchStaticFiles(s3URI, staticMetadata.geoLevels)
        ]);

        this.logger.debug(`downloaded data for s3URI ${s3URI}`);
        return new GeoUnitTopology(
          topology,
          { groups: geoLevelHierarchy.slice().reverse() },
          staticMetadata,
          demographics,
          geoLevels
        );
      } else {
        this.logger.error("Invalid TopoJSON or metadata bodies");
      }
    } catch (err) {
      this.logger.error(`Unable to download static files from for ${s3URI}: ${err}`);
    }
  }

  private async fetchStaticFiles(path: S3URI, files: readonly IStaticFile[]): Promise<UintArrays> {
    const requests = files.map(fileMeta =>
      this.s3.getObject(s3Options(path, fileMeta.fileName)).promise()
    );

    return new Promise((resolve, reject) => {
      Promise.all(requests)
        .then(response =>
          resolve(
            response.map((res, ind) => {
              const bpe = files[ind].bytesPerElement;
              const typedArrayConstructor =
                bpe === 1 ? Uint8Array : bpe === 2 ? Uint16Array : Uint32Array;

              // Note this is different from how we construct these typed
              // arrays on the client, due to differences in how Buffer works
              // in Node.js (see https://nodejs.org/api/buffer.html)
              const buf = res.Body as Buffer;
              const typedArray = new typedArrayConstructor(buf.buffer);
              return typedArray;
            })
          )
        )
        .catch(error => reject(error.message));
    });
  }
}
