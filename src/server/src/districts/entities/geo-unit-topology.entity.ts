import { FeatureCollection } from "geojson";
import * as topojson from "topojson-client";
import {
  GeometryCollection,
  GeometryObject,
  MultiPolygon,
  Polygon,
  Topology
} from "topojson-specification";

import { GeoUnitCollection, IStaticMetadata } from "../../../../shared/entities";
import { getAllIndices, getDemographics } from "../../../../shared/functions";
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

  constructor(
    public readonly topology: Topology,
    public readonly definition: GeoUnitDefinition,
    public readonly staticMetadata: IStaticMetadata,
    public readonly demographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
    public readonly geoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
  ) {
    this.hierarchy = group(topology, definition);
  }

  /*
   * Performs a merger of the specified districts into a GeoJSON collection,
   * or returns null if the district definition is invalid
   */
  merge(definition: DistrictsDefinitionDto, numberOfDistricts: number): FeatureCollection | null {
    // mutableDistrictGeoms contains the individual geometries prior to being merged
    // indexed by district id then by geolevel index
    const mutableDistrictGeoms: Array<Array<Array<MultiPolygon | Polygon>>> = Array.from(
      Array(numberOfDistricts + 1)
    ).map(_ => this.staticMetadata.geoLevelHierarchy.map(_ => []));
    const addToDistrict = (
      elem: GeoUnitCollection,
      hierarchy: GeoUnitHierarchy,
      level = 0
    ): boolean => {
      if (Array.isArray(elem)) {
        // If the array length doesn't match the length of our current place in
        // the hierarchy, the district definition is invalid
        if (elem.length !== hierarchy.children.length) {
          return false;
        }
        return elem.every((subelem, idx) =>
          addToDistrict(subelem, hierarchy.children[idx], level + 1)
        );
      } else if (typeof elem === "number" && elem >= 0) {
        const districtIndex = elem;
        mutableDistrictGeoms[districtIndex][level].push(hierarchy.geom);
        return true;
      }
      // Elements that are not non-negative numbers or arrays of the same are invalid
      return false;
    };

    // An empty (i.e. null) districts definition should instead be an array of zeros the
    // size of the top-most geolevel. It may make more sense to store it this way upon
    // project creation. However that will be more work, since we don't currently have access
    // to this information at the point where a project is being created, so it is being set
    // here in the interest of time.
    if (!definition.districts) {
      // @ts-ignore
      definition.districts = new Array(this.hierarchy.length).fill(0);
    }

    const valid =
      definition.districts.length === this.hierarchy.length &&
      definition.districts.every((elem, idx) => addToDistrict(elem, this.hierarchy[idx]));

    if (!valid) {
      return null;
    }

    const merged = mutableDistrictGeoms.map((geometries, idx) => {
      const mutableGeom = topojson.mergeArcs(this.topology, geometries.flat());
      const baseIndices = geometries.reduce((indices: number[], levelGeometries, levelIndex) => {
        const levelIds = levelGeometries
          .map(geom => geom.id)
          .filter(id => id !== undefined && typeof id === "number") as number[];
        const levelIndices =
          levelIndex === this.geoLevels.length
            ? levelIds
            : getAllIndices(this.geoLevels.slice().reverse()[levelIndex], new Set(levelIds));
        return indices.concat(levelIndices);
      }, []);
      mutableGeom.id = idx;
      mutableGeom.properties = getDemographics(baseIndices, this.staticMetadata, this.demographics);
      return mutableGeom;
    });
    return topojson.feature(this.topology, {
      type: "GeometryCollection",
      geometries: merged
    });
  }
}
