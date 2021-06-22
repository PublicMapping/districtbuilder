import {
  GeoUnitDefinition,
  HierarchyDefinition,
  GeoUnitHierarchy,
  IStaticMetadata
} from "../../../../shared/entities";
import { GeoUnitTopology } from "./geo-unit-topology.entity";

// A slimmed down version of GeoUniTopology without the geometries, only the feature properties
export class GeoUnitProperties {
  public readonly hierarchy: ReadonlyArray<GeoUnitHierarchy>;
  static fromTopology(geoUnitTopology: GeoUnitTopology): GeoUnitProperties {
    return new GeoUnitProperties(
      geoUnitTopology.definition,
      geoUnitTopology.hierarchyDefinition,
      geoUnitTopology.staticMetadata,
      geoUnitTopology.topologyProperties
    );
  }

  private constructor(
    public readonly definition: GeoUnitDefinition,
    public readonly hierarchyDefinition: HierarchyDefinition,
    public readonly staticMetadata: IStaticMetadata,
    public readonly topologyProperties: {
      readonly [layer: string]: readonly Record<string, unknown>[];
    }
  ) {}
}
