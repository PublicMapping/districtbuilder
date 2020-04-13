import { FeatureCollection } from "geojson";
import * as topojson from "topojson-client";
import {
  GeometryCollection,
  GeometryObject,
  MultiPolygon,
  Polygon,
  Topology
} from "topojson-specification";

import { GeoUnitCollection } from "../../../../shared/entities";
import { DistrictsDefinitionDto } from "./district-definition.dto";

interface GeoUnitHierarchy {
  geom: Polygon | MultiPolygon;
  children: ReadonlyArray<GeoUnitHierarchy>;
}

export interface GeoUnitDefinition {
  groups: ReadonlyArray<string>;
}

function group(
  topology: Topology,
  definition: GeoUnitDefinition,
  filter: (geom: GeometryObject) => boolean = _ => true
): ReadonlyArray<GeoUnitHierarchy> {
  const firstGroup = definition.groups[0];
  const remainingGroups = definition.groups.slice(1);
  const collection = topology.objects[firstGroup] as GeometryCollection;
  const filteredCollection = collection.geometries.filter(filter);

  return filteredCollection.map(
    geometry =>
      ({
        geom: geometry,
        children:
          remainingGroups.length === 0
            ? []
            : group(topology, { ...definition, groups: remainingGroups }, child => {
                const childProps = child.properties as any;
                const parentProps = geometry.properties as any;
                return childProps[firstGroup] === parentProps[firstGroup];
              })
      } as GeoUnitHierarchy)
  );
}

export class GeoUnitTopology {
  private readonly hierarchy: ReadonlyArray<GeoUnitHierarchy>;

  constructor(public readonly topology: Topology, public readonly definition: GeoUnitDefinition) {
    this.hierarchy = group(topology, definition);
  }

  /*
   * Performs a merger of the specified districts into a GeoJSON collection,
   * or returns null if the district definition is invalid
   */
  merge(definition: DistrictsDefinitionDto): FeatureCollection | null {
    const mutableDistrictGeoms: Array<Array<MultiPolygon | Polygon>> = [];
    const addToDistrict = (elem: GeoUnitCollection, hierarchy: GeoUnitHierarchy): boolean => {
      if (Array.isArray(elem)) {
        // If the array length doesn't match the length of our current place in
        // the hierarchy, the district definition is invalid
        if (elem.length !== hierarchy.children.length) {
          return false;
        }
        return elem.every((subelem, idx) => addToDistrict(subelem, hierarchy.children[idx]));
      } else if (typeof elem === "number" && elem >= 0) {
        const districtIndex = elem;
        if (!mutableDistrictGeoms[districtIndex]) {
          mutableDistrictGeoms[districtIndex] = [];
        }
        mutableDistrictGeoms[districtIndex].push(hierarchy.geom);
        return true;
      }
      // Elements that are not non-negative numbers or arrays of the same are invalid
      return false;
    };

    const valid =
      definition.districts.length === this.hierarchy.length &&
      definition.districts.every((elem, idx) => addToDistrict(elem, this.hierarchy[idx]));

    if (!valid) {
      return null;
    }

    // Without filling in all missing districts with empty arrays we'll get
    // 'null's instead of empty MultiPolygons
    // Need to use a numeric for loop BC Array.map(...) skips the undefined elems
    // tslint:disable-next-line:no-loop-statement
    for (let i = 0; i < mutableDistrictGeoms.length; i++) {
      if (!mutableDistrictGeoms[i]) {
        mutableDistrictGeoms[i] = [];
      }
    }

    const merged = mutableDistrictGeoms.map((geometries, idx) => {
      const mutableGeom = topojson.mergeArcs(this.topology, geometries);
      mutableGeom.id = idx;
      return mutableGeom;
    });
    return topojson.feature(this.topology, {
      type: "GeometryCollection",
      geometries: merged
    });
  }
}
