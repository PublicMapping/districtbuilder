import { Feature, MultiPolygon as GeoJSONMultiPolygon } from "geojson";
import * as topojson from "topojson-client";
import {
  GeometryCollection,
  GeometryObject,
  MultiPolygon,
  Polygon,
  Topology
} from "topojson-specification";

import area from "@turf/area";
import length from "@turf/length";
import polygonToLine from "@turf/polygon-to-line";

import {
  Contiguity,
  DistrictProperties,
  GeoUnitCollection,
  GeoUnitDefinition,
  HierarchyDefinition,
  IStaticMetadata,
  UintArrays,
  DistrictsDefinition,
  GeoUnitHierarchy
} from "../../../../shared/entities";
import { getAllBaseIndices, getDemographics, getVoting } from "../../../../shared/functions";
import { DistrictsGeoJSON } from "../../projects/entities/project.entity";
import { DistrictsDefinitionDto } from "./district-definition.dto";
import { mapValues } from "lodash";
import { GeoUnitProperties } from "./geo-unit-properties.entity";

interface GeoUnitPolygonHierarchy {
  geom: Polygon | MultiPolygon;
  children: ReadonlyArray<GeoUnitPolygonHierarchy>;
}

/*
 * Calculate Polsby-Popper compactness
 *
 * See https://fisherzachary.github.io/public/r-output.html#polsby-popper
 */
function calcPolsbyPopper(feature: Feature): [number, Contiguity] {
  if (
    feature.geometry &&
    feature.geometry.type === "MultiPolygon" &&
    feature.geometry.coordinates.length === 0
  ) {
    return [0, ""];
  }
  if (
    feature.geometry &&
    feature.geometry.type === "MultiPolygon" &&
    feature.geometry.coordinates.length > 1
  ) {
    return [0, "non-contiguous"];
  }
  const districtArea: number = area(feature);
  // @ts-ignore
  const outline = polygonToLine(feature);
  const districtPerimeter: number = length(outline, { units: "meters" });
  return [(4 * Math.PI * districtArea) / districtPerimeter ** 2, "contiguous"];
}

// Creates a list of trees for the nested geometries of the geounits
// This matches the possible structure of the DistrictDefinition
//
// We'll walk this hierarchy in conjuction with the district definition later
// to get the geometries needed to build our GeoJSON
function group(
  topology: Topology,
  definition: GeoUnitDefinition
): ReadonlyArray<GeoUnitPolygonHierarchy> {
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
): GeoUnitPolygonHierarchy {
  const firstGroup = definition.groups[0];
  const remainingGroups = definition.groups.slice(1);
  const geomId = geometry.properties[firstGroup];
  const childGeoms = geounitsByParentId[firstGroup][geomId];
  return {
    geom: geometry,
    children: childGeoms.map(childGeom =>
      getNode(childGeom, { ...definition, groups: remainingGroups }, geounitsByParentId)
    )
  } as GeoUnitPolygonHierarchy;
}

// Groups a topology into a hierarchy of geounits corresponding to a geo unit definition structure.
// Note: this function, along with getNodeForHierarchy are copy-pasted directly (w/rename) from
// process-geojson. We will need to fix #179 before we can share such code among projects.
function groupForHierarchy(topology: Topology, definition: GeoUnitDefinition): HierarchyDefinition {
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
        mutableMappings[geometry.properties[groupName]].push((geometry as unknown) as Polygon);
      });
    }
    return [groupName, mutableMappings];
  });

  const firstGroup = definition.groups[0];
  const toplevelCollection = topology.objects[firstGroup] as GeometryCollection;
  return toplevelCollection.geometries.map(geom =>
    getNodeForHierarchy(geom, definition, Object.fromEntries(geounitsByParentId))
  );
}

// Helper for recursively collecting geounit hierarchy node information
function getNodeForHierarchy(
  geometry: GeometryObject<any>,
  definition: GeoUnitDefinition,
  geounitsByParentId: {
    [groupName: string]: { [geounitId: string]: ReadonlyArray<Polygon | MultiPolygon> };
  }
): HierarchyDefinition {
  const firstGroup = definition.groups[0];
  const remainingGroups = definition.groups.slice(1);
  const geomId = geometry.properties[firstGroup];
  const childGeoms = geounitsByParentId[firstGroup][geomId];

  // Recurse until we get to the base geolevel, at which point we list the base geounit indices
  // eslint-disable-next-line
  return remainingGroups.length > 1
    ? childGeoms.map(childGeom =>
        getNodeForHierarchy(
          (childGeom as unknown) as GeometryObject<any>,
          { ...definition, groups: remainingGroups },
          geounitsByParentId
        )
      )
    : // eslint-disable-next-line
      childGeoms.map((childGeom: any) => childGeom.id);
}

type FeatureProperties = Pick<DistrictProperties, "demographics" | "voting">;

export class GeoUnitTopology {
  public readonly hierarchy: ReadonlyArray<GeoUnitPolygonHierarchy>;

  constructor(
    public readonly topology: Topology,
    public readonly definition: GeoUnitDefinition,
    public readonly staticMetadata: IStaticMetadata,
    public readonly demographics: UintArrays,
    public readonly voting: UintArrays,
    public readonly geoLevels: UintArrays
  ) {
    this.hierarchy = group(topology, definition);
  }

  /*
   * Performs a merger of the specified districts into a GeoJSON collection,
   * or returns null if the district definition is invalid
   */
  merge(definition: DistrictsDefinitionDto, numberOfDistricts: number): DistrictsGeoJSON | null {
    // mutableDistrictGeoms contains the individual geometries prior to being merged
    // indexed by district id then by geolevel index
    const mutableDistrictGeoms: Array<Array<Array<MultiPolygon | Polygon>>> = Array.from(
      Array(numberOfDistricts + 1)
    ).map(_ => this.staticMetadata.geoLevelHierarchy.map(_ => []));
    const addToDistrict = (
      elem: GeoUnitCollection,
      hierarchy: GeoUnitPolygonHierarchy,
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
        const levelIndices = getAllBaseIndices(
          this.geoLevels.slice().reverse(),
          levelIndex,
          levelIds
        );
        return indices.concat(levelIndices);
      }, []);
      mutableGeom.id = idx;
      const geom: MultiPolygon<FeatureProperties> = {
        ...mutableGeom,
        properties: {
          demographics: getDemographics(baseIndices, this.staticMetadata, this.demographics),
          voting: getVoting(baseIndices, this.staticMetadata, this.voting)
        }
      };
      return geom;
    });
    const featureCollection = topojson.feature(this.topology, {
      type: "GeometryCollection",
      geometries: merged
    });
    return {
      ...featureCollection,
      features: featureCollection.features.map(feature => {
        const [compactness, contiguity] = calcPolsbyPopper(feature);
        const geometry = feature.geometry as GeoJSONMultiPolygon;

        return {
          ...feature,
          geometry,
          properties: {
            ...feature.properties,
            compactness,
            contiguity
          }
        };
      })
    };
  }

  importFromCSV(blockToDistricts: { readonly [block: string]: number }): DistrictsDefinition {
    const baseGeoLevel = this.definition.groups.slice().reverse()[0];
    const baseGeoUnitProperties = this.topologyProperties[baseGeoLevel];

    // The geounit hierarchy and district definition have the same structure (except the
    // hierarchy always goes out to the base geounit level), so we use it as a starting point
    // and transform it into our districts definition.
    const mapToDefinition = (hierarchySubset: GeoUnitHierarchy): DistrictsDefinition =>
      hierarchySubset.map(hierarchyNumOrArray => {
        if (typeof hierarchyNumOrArray === "number") {
          // The numbers found in the hierarchy are the base geounit indices of the topology.
          // Access this item in the topology to find it's base geounit id.
          const props: any = baseGeoUnitProperties[hierarchyNumOrArray];
          const id = props[baseGeoLevel];
          return blockToDistricts[id] || 0;
        } else {
          // Keep recursing into the hierarchy until we reach the end
          const results = mapToDefinition(hierarchyNumOrArray);
          // Simplify if possible
          return results.every(item => item === results[0]) ? results[0] : results;
        }
      });

    return mapToDefinition(this.hierarchyDefinition);
  }

  get topologyProperties() {
    return mapValues(this.topology.objects, collection =>
      collection.type === "GeometryCollection"
        ? collection.geometries.map(feature => feature.properties || {})
        : []
    );
  }

  // Generates the geounit hierarchy corresponding to a geo unit definition structure
  get hierarchyDefinition() {
    const geoLevelIds = this.staticMetadata.geoLevelHierarchy.map(level => level.id);
    const definition = { groups: geoLevelIds.slice().reverse() };
    return groupForHierarchy(this.topology, definition);
  }
}
