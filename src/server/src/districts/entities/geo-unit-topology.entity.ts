import {
  GeoUnitDefinition,
  IStaticMetadata,
  TypedArrays,
  DistrictsDefinition,
  IRegionConfig,
  IUser,
  IChamber,
  TopologyProperties
} from "../../../../shared/entities";
import { DistrictsGeoJSON } from "../../projects/entities/project.entity";
import { merge, exportToCSV, getTopologyProperties, importFromCSV } from "../../worker-pool";

export class GeoUnitTopology {
  constructor(
    public readonly definition: GeoUnitDefinition,
    public readonly staticMetadata: IStaticMetadata,
    public readonly regionConfig: IRegionConfig,
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
    readonly user: IUser;
    readonly chamber?: IChamber;
    readonly regionConfig: IRegionConfig;
  }): Promise<DistrictsGeoJSON | null> {
    return merge({
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
    return importFromCSV(this.staticMetadata, this.regionConfig, blockToDistricts);
  }

  async exportToCSV(districtsDefinition: DistrictsDefinition): Promise<[string, number][]> {
    return exportToCSV(this.staticMetadata, this.regionConfig, districtsDefinition);
  }

  async getTopologyProperties(): Promise<TopologyProperties> {
    return getTopologyProperties(this.regionConfig);
  }
}
