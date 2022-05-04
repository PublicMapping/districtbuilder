import {
  GeoUnitDefinition,
  IStaticMetadata,
  TypedArrays,
  DistrictsDefinition,
  TopologyProperties
} from "../../../../shared/entities";
import { Chamber } from "../../chambers/entities/chamber.entity";
import { DistrictsGeoJSON } from "../../projects/entities/project.entity";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { User } from "../../users/entities/user.entity";

import { WorkerPoolService } from "../services/worker-pool.service";

export class GeoUnitTopology {
  constructor(
    public readonly workerService: WorkerPoolService,
    public readonly definition: GeoUnitDefinition,
    public readonly staticMetadata: IStaticMetadata,
    public readonly regionConfig: RegionConfig,
    public readonly demographics: TypedArrays,
    public readonly voting: TypedArrays,
    public readonly geoLevels: TypedArrays,
    public readonly districtsDefLength: number
  ) {}

  /*
   * Performs a merger of the specified districts into a GeoJSON collection,
   * or returns null if the district definition is invalid
   */
  async merge({
    districtsDefinition,
    numberOfDistricts,
    user,
    chamber,
    regionConfig
  }: {
    readonly districtsDefinition: DistrictsDefinition;
    readonly numberOfDistricts: number;
    readonly user: User;
    readonly chamber?: Chamber;
    readonly regionConfig: RegionConfig;
  }): Promise<DistrictsGeoJSON | null> {
    return this.workerService.merge({
      districtsDefinition,
      numberOfDistricts,
      user,
      chamber,
      regionConfig,
      staticMetadata: this.staticMetadata,
      geoLevels: this.geoLevels,
      demographics: this.demographics,
      voting: this.voting
    });
  }

  async importFromCSV(blockToDistricts: {
    readonly [block: string]: number;
  }): Promise<DistrictsDefinition> {
    return this.workerService.importFromCSV(
      this.staticMetadata,
      this.regionConfig,
      blockToDistricts
    );
  }

  async exportToCSV(districtsDefinition: DistrictsDefinition): Promise<[string, number][]> {
    return this.workerService.exportToCSV(
      this.staticMetadata,
      this.regionConfig,
      districtsDefinition
    );
  }

  async getTopologyProperties(): Promise<TopologyProperties> {
    return this.workerService.getTopologyProperties(this.regionConfig, this.staticMetadata);
  }
}
