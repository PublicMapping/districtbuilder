import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import S3 from "aws-sdk/clients/s3";
import { spawn } from "child_process";
import _ from "lodash";
import Queue from "promise-queue";
import { Repository } from "typeorm";

import { TypedArrays, IStaticFile, IStaticMetadata, S3URI } from "../../../../shared/entities";

import { NUM_WORKERS } from "../../common/constants";
import { getObject, s3Options } from "../../common/functions";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { cacheSize, getTopologyProperties } from "../../worker-pool";

import { GeoUnitTopology } from "../entities/geo-unit-topology.entity";

const MAX_RETRIES = 5;
// Loading a topojson layer is a mix of I/O and CPU intensive work,
// so we can afford to have more layers loading than we have cores, but not too many
const BATCH_SIZE = NUM_WORKERS * 2;

type Layer = Promise<GeoUnitTopology | undefined>;

interface Layers {
  [s3URI: string]: null | Layer;
}

@Injectable()
export class TopologyService {
  private _layers?: Layers = undefined;
  private readonly logger = new Logger(TopologyService.name);
  private readonly s3 = new S3();
  private readonly downloadQueue = new Queue(BATCH_SIZE);

  constructor(@InjectRepository(RegionConfig) private readonly repo: Repository<RegionConfig>) {}

  public loadLayers() {
    void this.repo
      .find({
        where: { archived: false },
        order: { layerSizeInBytes: "DESC" }
      })
      .then(regionConfigs => {
        const getLayers = async () => {
          // eslint-disable-next-line functional/immutable-data
          this._layers = regionConfigs.reduce(
            (layers, regionConfig) => ({
              ...layers,
              [regionConfig.s3URI]: null
            }),
            {}
          );

          const totalSize = _.sum(regionConfigs.map(r => r.layerSizeInBytes));
          // If all regions will fit, load largest states first, to reduce chances for cache fragmentation
          // Otherwise load largest last so they won't get evicted
          const sortedRegions =
            totalSize < cacheSize ? regionConfigs : regionConfigs.slice().reverse();

          await Promise.all(
            sortedRegions.map(region =>
              // Load a number of regions in parallel, adding another as each one completes
              this.downloadQueue.add(() => {
                const promise = this.fetchLayer(region);
                // eslint-disable-next-line functional/immutable-data
                this._layers = { ...this._layers, [region.s3URI]: promise };
                return promise;
              })
            )
          );
        };
        void getLayers();
      });
  }

  public layers(): Readonly<Layers> | undefined {
    return this._layers && Object.freeze({ ...this._layers });
  }

  public async get(regionConfig: RegionConfig): Promise<GeoUnitTopology | undefined> {
    if (!this._layers) {
      return;
    }
    if (!(regionConfig.s3URI in this._layers)) {
      // If we encounter a new layer (i.e. one added after the service has started),
      // then store the results in the `_layers` object.
      // eslint-disable-next-line functional/immutable-data
      this._layers[regionConfig.s3URI] = this.fetchLayer(regionConfig).catch(err => {
        this.logger.error(err);
        return undefined;
      });
    }
    const layer = this._layers[regionConfig.s3URI];
    if (layer !== null) {
      return layer;
    }
  }

  private async fetchLayer(
    regionConfig: RegionConfig,
    numRetries = 0
  ): Promise<GeoUnitTopology | undefined> {
    try {
      const staticMetadataResponse = await getObject(
        this.s3,
        s3Options(regionConfig.s3URI, "static-metadata.json")
      );

      const staticMetadataBody = staticMetadataResponse.Body?.toString("utf8");
      if (staticMetadataBody) {
        const staticMetadata = JSON.parse(staticMetadataBody) as IStaticMetadata;
        const geoLevelHierarchy = staticMetadata.geoLevelHierarchy.map(gl => gl.id);
        if (!geoLevelHierarchy) {
          this.logger.error(
            `geoLevelHierarchy missing from static metadata for ${regionConfig.s3URI}`
          );
        }
        // Getting topology properties to know what the districts definition length is has
        // the helpful side-effect of downloading data & prewarming a worker
        const districtsDefLength = await this.getDistrictsDefLength(regionConfig, staticMetadata);
        const [demographics, geoLevels, voting] = await Promise.all([
          this.fetchStaticFiles(regionConfig.s3URI, staticMetadata.demographics),
          this.fetchStaticFiles(regionConfig.s3URI, staticMetadata.geoLevels),
          this.fetchStaticFiles(regionConfig.s3URI, staticMetadata.voting || [])
        ]);

        this.logger.debug(`downloaded data for s3URI ${regionConfig.s3URI}`);
        // We no longer use archived read-only region topology for exports,
        // so always return geoUnitTopology
        return new GeoUnitTopology(
          { groups: geoLevelHierarchy.slice().reverse() },
          staticMetadata,
          regionConfig,
          demographics,
          voting,
          geoLevels,
          districtsDefLength
        );
      } else {
        this.logger.error("Invalid TopoJSON or metadata bodies");
      }
    } catch (err) {
      this.logger.error(
        `Failed to load topology for '${regionConfig.s3URI}' ${numRetries + 1} times, err ${err}`
      );
      if (numRetries < MAX_RETRIES) {
        return this.fetchLayer(regionConfig, numRetries + 1);
      } else {
        // Nest spawns multiple processes, so to shutdown the main container process we need to
        // kill all running node instances
        spawn("pkill", ["node"]).once("exit", () => {
          process.exit(1);
        });
      }
    }
  }

  // Computes the length of the districtsDefinition array
  // For most regions, this is the number of counties in the state
  private async getDistrictsDefLength(regionConfig: RegionConfig, staticMetadata: IStaticMetadata) {
    const topGeoLevel = staticMetadata.geoLevelHierarchy.slice().reverse()[0].id;
    const properties = await getTopologyProperties(regionConfig, staticMetadata, 0);
    return properties[topGeoLevel] ? properties[topGeoLevel].length : 0;
  }

  private async fetchStaticFiles(path: S3URI, files: readonly IStaticFile[]): Promise<TypedArrays> {
    const requests = files.map(fileMeta => getObject(this.s3, s3Options(path, fileMeta.fileName)));

    return new Promise((resolve, reject) => {
      Promise.all(requests)
        .then(response =>
          resolve(
            response.map((res, ind) => {
              const bpe = files[ind].bytesPerElement;
              const unsigned = files[ind].unsigned;
              const typedArrayConstructor =
                unsigned || unsigned === undefined
                  ? bpe === 1
                    ? Uint8Array
                    : bpe === 2
                    ? Uint16Array
                    : Uint32Array
                  : bpe === 1
                  ? Int8Array
                  : bpe === 2
                  ? Int16Array
                  : Int32Array;

              // Note this is different from how we construct these typed
              // arrays on the client, due to differences in how Buffer works
              // in Node.js (see https://nodejs.org/api/buffer.html)
              const buf = res.Body as Buffer;
              // We use a SharedArrayBuffer instead of re-using the S3 buffer in
              // order to share the data between threads
              const sharedArray = new typedArrayConstructor(
                new SharedArrayBuffer(buf.buffer.byteLength)
              );
              sharedArray.set(new typedArrayConstructor(buf.buffer));

              return sharedArray;
            })
          )
        )
        .catch(error => reject(error.message));
    });
  }
}
