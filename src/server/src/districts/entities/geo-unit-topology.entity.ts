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

// Creates a list of trees for the nested geometries of the geounits
// This matches the possible structure of the DistrictDefinition
//
// We'll walk this hierarchy in conjuction with the district definition later
// to get the geometries needed to build our GeoJSON
function group(topology: Topology, definition: GeoUnitDefinition): ReadonlyArray<GeoUnitHierarchy> {
  // Run through all topology objects in a single pass and build up a list of
  // them keyed by their parent geometries ID, which we'll use to quickly look
  // up child geometries when we build up our list of trees later in getNode
  const geounitsByParentId = definition.groups.map((groupName, index) => {
    const parentCollection = topology.objects[groupName] as GeometryCollection;
    const mutableMappings: {
      [geounitId: string]: Array<Polygon | MultiPolygon>;
    } = Object.fromEntries(
      parentCollection.geometries.map((geom: GeometryObject<any>) => [
        geom.properties[groupName],
        []
      ])
    );
    const childGroupName = definition.groups[index + 1];
    if (childGroupName) {
      const childCollection = topology.objects[childGroupName] as GeometryCollection;
      childCollection.geometries.forEach((geometry: GeometryObject<any>) => {
        if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
          mutableMappings[geometry.properties[groupName]].push(geometry);
        }
      });
    }
    return [groupName, mutableMappings];
  });

  const firstGroup = definition.groups[0];
  const toplevelCollection = topology.objects[firstGroup] as GeometryCollection;
  return toplevelCollection.geometries.map(geom =>
    getNode(geom, definition, Object.fromEntries(geounitsByParentId))
  );
}

function getNode(
  geometry: GeometryObject<any>,
  definition: GeoUnitDefinition,
  geounitsByParentId: {
    [groupName: string]: { [geounitId: string]: ReadonlyArray<Polygon | MultiPolygon> };
  }
): GeoUnitHierarchy {
  const firstGroup = definition.groups[0];
  const remainingGroups = definition.groups.slice(1);
  const geomId = geometry.properties[firstGroup];
  const childGeoms = geounitsByParentId[firstGroup][geomId];
  return {
    geom: geometry,
    children: childGeoms.map(childGeom =>
      getNode(childGeom, { ...definition, groups: remainingGroups }, geounitsByParentId)
    )
  } as GeoUnitHierarchy;
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

    if (!definition.districts) {
      return null;
    }

    const valid =
      definition.districts.length === this.hierarchy.length &&
      definition.districts.every((elem, idx) => addToDistrict(elem, this.hierarchy[idx]));

    if (!valid) {
      return null;
    }

    // Without filling in all missing districts with empty arrays we'll get
    // 'null's instead of empty MultiPolygons
    // Need to use a numeric for loop BC Array.map(...) skips the undefined elems
    // eslint-disable-next-line functional/no-loop-statement
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
