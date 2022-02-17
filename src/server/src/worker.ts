import area from "@turf/area";
import length from "@turf/length";
import polygonToLine from "@turf/polygon-to-line";
import { Feature, MultiPolygon as GeoJSONMultiPolygon } from "geojson";
import _, { mapValues } from "lodash";
import LRU from "lru-cache";
import os from "os";
import { expose } from "threads/worker";
import * as topojson from "topojson-client";
import {
  GeometryCollection,
  GeometryObject,
  MultiPolygon,
  Polygon,
  Topology
} from "topojson-specification";

import {
  Contiguity,
  DistrictProperties,
  DistrictsDefinition,
  GeoUnitCollection,
  GeoUnitDefinition,
  GeoUnitHierarchy,
  HierarchyDefinition,
  IChamber,
  IRegionConfig,
  IStaticMetadata,
  IUser,
  TopologyProperties,
  TypedArrays
} from "../../shared/entities";
import { getAllBaseIndices, getDemographics, getVoting } from "../../shared/functions";
import { NUM_WORKERS } from "./common/constants";
import { getTopologyFromDisk } from "./common/functions";
import { DistrictsGeoJSON } from "./projects/entities/project.entity";

interface GeoUnitPolygonHierarchy {
  geom: Polygon | MultiPolygon;
  children: ReadonlyArray<GeoUnitPolygonHierarchy>;
}

type GroupedPolygons = {
  [groupName: string]: { [geounitId: string]: ReadonlyArray<Polygon | MultiPolygon> };
};

type FeatureProperties = Pick<DistrictProperties, "demographics" | "voting">;

// Reserve 80% of total memory for topology data, split amongst each worker
// Remaining 20% is left available to the framework / handling requests
const maxCacheSize = Math.ceil((os.totalmem() / NUM_WORKERS) * 0.8);

const cachedTopology = new LRU<string, [Topology, readonly GeoUnitPolygonHierarchy[]]>({
  max: 100,
  maxSize: maxCacheSize
});

async function getTopology(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
): Promise<[Topology, readonly GeoUnitPolygonHierarchy[]]> {
  const cachedData = cachedTopology.get(regionConfig.s3URI);
  if (cachedData) {
    return cachedData;
  }
  const topology = await getTopologyFromDisk(regionConfig);
  const geoLevelIds = staticMetadata.geoLevelHierarchy.map(level => level.id);
  const definition = { groups: geoLevelIds.slice().reverse() };
  const hierarchy = group(topology, definition);
  cachedTopology.set(regionConfig.s3URI, [topology, hierarchy]);
  return [topology, hierarchy];
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
      const childCollection = topology.objects[childGroupName] as GeometryCollection<any>;
      childCollection.geometries.forEach((geometry: GeometryObject<any>) => {
        if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
          mutableMappings[geometry.properties[groupName]].push(geometry);
        }
      });
    }
    return [groupName, mutableMappings];
  });

  const firstGroup = definition.groups[0];
  const toplevelCollection = topology.objects[firstGroup] as GeometryCollection<any>;
  const geounits: GroupedPolygons = Object.fromEntries(geounitsByParentId);
  return toplevelCollection.geometries.map(geom => getNodeForHierarchy(geom, definition, geounits));
}

// Helper for recursively collecting geounit hierarchy node information
function getNodeForHierarchy(
  geometry: GeometryObject<any>,
  definition: GeoUnitDefinition,
  geounitsByParentId: GroupedPolygons
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
          childGeom as GeometryObject<any>,
          { ...definition, groups: remainingGroups },
          geounitsByParentId
        )
      )
    : // eslint-disable-next-line
      childGeoms.map((childGeom: any) => childGeom.id);
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
  const toplevelCollection = topology.objects[firstGroup] as GeometryCollection<any>;
  const geounits: GroupedPolygons = Object.fromEntries(geounitsByParentId);
  return toplevelCollection.geometries.map(geom => getNode(geom, definition, geounits));
}

function getNode(
  geometry: GeometryObject<any>,
  definition: GeoUnitDefinition,
  geounitsByParentId: GroupedPolygons
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

// Generates the geounit hierarchy corresponding to a geo unit definition structure
function getHierarchyDefinition(staticMetadata: IStaticMetadata, topology: Topology) {
  const geoLevelIds = staticMetadata.geoLevelHierarchy.map(level => level.id);
  const definition = { groups: geoLevelIds.slice().reverse() };
  return groupForHierarchy(topology, definition);
}

/*
 * Performs a merger of the specified districts into a GeoJSON collection,
 * or returns null if the district definition is invalid
 */
export type MergeArgs = {
  readonly districtsDefinition: DistrictsDefinition;
  readonly numberOfDistricts: number;
  readonly user: IUser;
  readonly chamber?: IChamber;
  readonly regionConfig: IRegionConfig;
  readonly staticMetadata: IStaticMetadata;
  readonly geoLevels: TypedArrays;
  readonly demographics: TypedArrays;
  readonly voting: TypedArrays;
};
async function merge({
  districtsDefinition,
  numberOfDistricts,
  user,
  chamber,
  regionConfig,
  staticMetadata,
  geoLevels,
  demographics,
  voting
}: MergeArgs): Promise<DistrictsGeoJSON | null> {
  const [topology, hierarchy] = await getTopology(regionConfig, staticMetadata);

  // mutableDistrictGeoms contains the individual geometries prior to being merged
  // indexed by district id then by geolevel index
  const mutableDistrictGeoms: Array<Array<Array<MultiPolygon | Polygon>>> = Array.from(
    Array(numberOfDistricts + 1)
  ).map(_ => staticMetadata.geoLevelHierarchy.map(_ => []));
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
      return elem.every((subelem: GeoUnitCollection, idx: number) =>
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
    districtsDefinition.length === hierarchy.length &&
    districtsDefinition.every((elem, idx) => addToDistrict(elem, hierarchy[idx]));

  if (!valid) {
    return null;
  }

  const merged = mutableDistrictGeoms.map((geometries, idx) => {
    const mutableGeom = topojson.mergeArcs(topology, geometries.flat());
    const baseIndices = geometries.reduce((indices: number[], levelGeometries, levelIndex) => {
      const levelIds = levelGeometries
        .map(geom => geom.id)
        .filter(id => id !== undefined && typeof id === "number") as number[];
      const levelIndices = getAllBaseIndices(geoLevels.slice().reverse(), levelIndex, levelIds);
      return indices.concat(levelIndices);
    }, []);
    mutableGeom.id = idx;
    const geom: MultiPolygon<FeatureProperties> = {
      ...mutableGeom,
      properties: {
        demographics: getDemographics(baseIndices, staticMetadata, demographics),
        voting: getVoting(baseIndices, staticMetadata, voting)
      }
    };
    return geom;
  });
  const featureCollection = topojson.feature(topology, {
    type: "GeometryCollection",
    geometries: merged
  });
  return {
    ...featureCollection,
    // FeatureCollection objects cannot have 'properties' (RFC7964 Sec 7),
    // but they can have other unrecognized fields (Sec 6.1)
    // so we put all non-district data in this top-level metadata field
    metadata: {
      completed:
        featureCollection.features[0].geometry.type === "MultiPolygon" &&
        featureCollection.features[0].geometry.coordinates.length === 0,
      chamber,
      creator: _.pick(user, ["id", "name"]),
      regionConfig: _.pick(regionConfig, ["id", "name", "regionCode", "countryCode", "s3URI"])
    },
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

async function importFromCSV(
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  blockToDistricts: {
    readonly [block: string]: number;
  }
): Promise<DistrictsDefinition> {
  const [topology] = await getTopology(regionConfig, staticMetadata);
  const baseGeoLevel = staticMetadata.geoLevelHierarchy[0].id;
  const baseGeoUnitProperties = (await getTopologyProperties(regionConfig, staticMetadata))[
    baseGeoLevel
  ];

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
        return results.length !== 1 && results.every(item => item === results[0])
          ? results[0]
          : results;
      }
    });

  return mapToDefinition(getHierarchyDefinition(staticMetadata, topology));
}

async function exportToCSV(
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  districtsDefinition: DistrictsDefinition
): Promise<[string, number][]> {
  const [topology] = await getTopology(regionConfig, staticMetadata);
  const baseGeoLevel = staticMetadata.geoLevelHierarchy[0].id;
  const baseGeoUnitProperties = (await getTopologyProperties(regionConfig, staticMetadata))[
    baseGeoLevel
  ];

  // First column is the base geounit id, second column is the district id
  const mutableCsvRows: [string, number][] = [];

  // The geounit hierarchy and district definition have the same structure (except the
  // hierarchy always goes out to the base geounit level). Walk them both at the same time
  // and collect the information needed for the CSV (base geounit id and district id).
  const accumulateCsvRows = (
    defnSubset: number | GeoUnitHierarchy,
    hierarchySubset: GeoUnitHierarchy
  ) => {
    hierarchySubset.forEach((hierarchyNumOrArray, idx) => {
      const districtOrArray = typeof defnSubset === "number" ? defnSubset : defnSubset[idx];
      if (typeof districtOrArray === "number" && typeof hierarchyNumOrArray === "number") {
        // The numbers found in the hierarchy are the base geounit indices of the topology.
        // Access this item in the topology to find it's base geounit id.
        const props: any = baseGeoUnitProperties[hierarchyNumOrArray];
        const baseId = props[baseGeoLevel] as string;
        mutableCsvRows.push([baseId, districtOrArray]);
      } else if (typeof hierarchyNumOrArray !== "number") {
        // Keep recursing into the hierarchy until we reach the end
        accumulateCsvRows(districtOrArray, hierarchyNumOrArray);
      }
    });
  };
  accumulateCsvRows(districtsDefinition, getHierarchyDefinition(staticMetadata, topology));

  return mutableCsvRows;
}

async function getTopologyProperties(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
): Promise<TopologyProperties> {
  const [topology] = await getTopology(regionConfig, staticMetadata);
  return mapValues(topology.objects, collection =>
    collection.type === "GeometryCollection"
      ? collection.geometries.map(feature => feature.properties || {})
      : []
  );
}

const functions = {
  merge,
  importFromCSV,
  exportToCSV,
  getTopologyProperties
};

export type Functions = typeof functions;

expose(functions);
