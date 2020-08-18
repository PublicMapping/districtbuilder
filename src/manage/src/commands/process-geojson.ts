import { Command, flags } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import cli from "cli-ux";
import { mapSync } from "event-stream";
import { createReadStream, existsSync, readFileSync, writeFileSync } from "fs";
import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { parse } from "JSONStream";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import { join } from "path";
import { feature as topo2feature, mergeArcs } from "topojson-client";
import { topology } from "topojson-server";
import { planarTriangleArea, presimplify, simplify } from "topojson-simplify";
import { GeometryCollection, GeometryObject, Objects, Topology } from "topojson-specification";
import {
  GeoLevelInfo,
  GeoUnitDefinition,
  HierarchyDefinition,
  IStaticFile,
  IStaticMetadata
} from "../../../shared/entities";
import { geojsonPolygonLabels, tileJoin, tippecanoe } from "../lib/cmd";

export default class ProcessGeojson extends Command {
  static description = `process GeoJSON into desired output files

Note: this can be a very memory-intensive operation,
depending on the size of the GeoJSON. If you receive
an error related to memory usage, you can increase
the Node.js memory limit by setting the following
environment variable (as large as needed):

NODE_OPTIONS="--max-old-space-size=14336"

Relatedly, set the -b flag for very large GeoJSON files
that need to be streamed. This is slower, so only use
it when necessary (file sizes ~1GB+).
`;

  static flags = {
    big: flags.boolean({
      char: "b",
      description: "Use this for big GeoJSON files (~1GB+) that need to be streamed"
    }),

    levels: flags.string({
      char: "l",
      description: "Comma-separated geolevel hierarchy: smallest to largest",
      default: "block,blockgroup,county"
    }),

    levelMinZoom: flags.string({
      char: "n",
      description: "Comma-separated minimum zoom level per geolevel, must match # of levels",
      default: "8,0,0"
    }),

    levelMaxZoom: flags.string({
      char: "x",
      description: "Comma-separated maximum zoom level per geolevel, must match # of levels",
      default: "g,g,g"
    }),

    demographics: flags.string({
      char: "d",
      description: "Comma-separated census demographics to select and aggregate",
      default: "population,white,black,asian,hispanic,other"
    }),

    simplification: flags.string({
      char: "s",
      description: "Topojson simplification amount (minWeight)",
      default: "0.000000001"
    }),

    outputDir: flags.string({
      char: "o",
      description: "Directory to output files",
      default: "./"
    })
  };

  static args: [IArg] = [{ name: "file", required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(ProcessGeojson);

    if (!existsSync(args.file)) {
      this.log(`file ${args.file} does not exist, exiting`);
      return;
    }

    if (!existsSync(flags.outputDir)) {
      this.log(`output directory ${flags.outputDir} does not exist, exiting`);
      return;
    }

    const geoLevels = flags.levels.split(",");
    const minZooms = flags.levelMinZoom.split(",");
    const maxZooms = flags.levelMaxZoom.split(",");
    const demographics = flags.demographics.split(",");
    const simplification = parseFloat(flags.simplification);

    if (geoLevels.length !== minZooms.length || geoLevels.length !== maxZooms.length) {
      this.log("'levels' 'levelMinZoom' and 'levelMaxZoom' must all have the same length, exiting");
      return;
    }

    cli.action.start(`Reading base GeoJSON: ${args.file}`);
    const baseGeoJson = await (flags.big
      ? this.readBigGeoJson(args.file)
      : this.readSmallGeoJson(args.file));
    cli.action.stop();

    const numFeatures = baseGeoJson.features.length;
    this.log(`GeoJSON contains ${numFeatures.toString()} features`);
    if (numFeatures <= 0) {
      this.log(`GeoJSON must have features, exiting`);
      return;
    }

    const firstFeature = baseGeoJson.features[0];
    for (const demo of demographics) {
      if (!(demo in firstFeature.properties)) {
        this.log(`Demographic: "${demo}" not present in features, exiting`);
        return;
      }
    }
    for (const level of geoLevels) {
      if (!(level in firstFeature.properties)) {
        this.log(`Geolevel: "${level}" not present in features, exiting`);
        return;
      }
    }

    const topoJsonHierarchy = this.mkTopoJsonHierarchy(
      baseGeoJson,
      geoLevels,
      demographics,
      simplification
    );

    const bbox = topoJsonHierarchy.bbox;
    if (bbox === undefined || bbox.length !== 4) {
      this.log(`Invalid bbox: "${bbox}"`);
      return;
    }

    this.writeTopoJson(flags.outputDir, topoJsonHierarchy);

    this.addGeoLevelIndices(topoJsonHierarchy, geoLevels);

    this.writeIntermediaryGeoJson(flags.outputDir, topoJsonHierarchy, geoLevels);

    const geoLevelHierarchyInfo = this.writeVectorTiles(
      flags.outputDir,
      geoLevels,
      minZooms,
      maxZooms
    );

    const demographicMetaData = this.writeDemographicData(
      flags.outputDir,
      topoJsonHierarchy,
      geoLevels[0],
      demographics
    );

    const geoLevelMetaData = this.writeGeoLevelIndices(
      flags.outputDir,
      topoJsonHierarchy,
      geoLevels
    );

    this.writeGeounitHierarchy(flags.outputDir, topoJsonHierarchy, geoLevels);

    this.writeStaticMetadata(
      flags.outputDir,
      demographicMetaData,
      geoLevelMetaData,
      bbox,
      geoLevelHierarchyInfo
    );
  }

  // Generates a TopoJSON topology with aggregated hierarchical data
  mkTopoJsonHierarchy(
    baseGeoJson: FeatureCollection<Polygon, any>,
    geoLevels: readonly string[],
    demographics: readonly string[],
    simplification: number
  ): Topology<Objects<{}>> {
    const baseGeoLevel = geoLevels[0];
    this.log(`Converting to topojson with base geolevel: ${baseGeoLevel}`);
    const baseTopoJson = topology({ [baseGeoLevel]: baseGeoJson });

    this.log("Presimplifying using planar triangle area");
    const preSimplifiedBaseTopoJson = presimplify(
      baseTopoJson as Topology<Objects<{}>>,
      planarTriangleArea
    );

    this.log(`Simplifying ${baseGeoLevel} geounits with minWeight: ${simplification}`);
    const topo = simplify(preSimplifiedBaseTopoJson, simplification);

    for (const [prevIndex, geoLevel] of geoLevels.slice(1).entries()) {
      const currIndex = prevIndex + 1;
      const currGeoLevel = geoLevels[currIndex];
      const prevGeoLevel = geoLevels[prevIndex];

      // Note: the types defined by Topojson are lacking, and are often subtly
      // inconsistent among functions. Unfortunately, a batch of `any` types were
      // needed to be deployed here, even though it was very close without them.
      const prevGeoms: any = (topo.objects[prevGeoLevel] as any).geometries;

      this.log(`Grouping geoLevel "${geoLevel}"`);
      const grouped = groupBy(prevGeoms, f => f.properties[currGeoLevel]);

      this.log(`Merging ${Object.keys(grouped).length} features`);
      const mergedGeoms: any = mapValues(grouped, (geoms: readonly [Feature]) => {
        const merged: any = mergeArcs(topo, geoms as any);
        const firstGeom = geoms[0];

        /* tslint:disable:no-object-mutation */
        // It may be possible to do this without mutation, but it would require going
        // very against-the-grain with the topojson library, and would be less performant
        merged.properties = {};

        // Aggregate all desired demographic data
        for (const demo of demographics) {
          merged.properties[demo] = this.aggProperty(geoms, demo);
        }

        // Set the geolevel keys for this level, as well as all larger levels
        // e.g. if we're creating tracts, we want to store what tract this is for,
        // and also what county this tract belongs to. This is used for subsequent
        // hierarchy calculations, and is also needed by other parts of the
        // application, such as for constructing districs.
        for (const level of geoLevels.slice(currIndex)) {
          merged.properties[level] = firstGeom?.properties?.[level];
        }
        /* tslint:enable */

        return merged;
      });

      // tslint:disable-next-line:no-object-mutation
      topo.objects[currGeoLevel] = {
        type: "GeometryCollection",
        geometries: Object.values(mergedGeoms)
      };
    }
    // Add an 'id' to each feature. This is implicit now but will
    // become necessary to index static data array buffers once the features
    // are converted into vector tiles.
    // We are using the id here, rather than a property, because an id is needed
    // in order to use the `setFeatureState` capability on the front-end.
    for (const geoLevel of geoLevels) {
      const geomCollection = topo.objects[geoLevel] as GeometryCollection;
      geomCollection.geometries.forEach((geometry: GeometryObject, index) => {
        // tslint:disable-next-line:no-object-mutation
        geometry.id = index;

        // Add abbreviated label
        for (const demo of demographics) {
          // @ts-ignore
          geometry.properties[`${demo}-abbrev`] = abbreviateNumber(geometry.properties[demo]);
        }
      });
    }

    return topo;
  }

  // Helper for aggregating properties by addition
  aggProperty(geoms: readonly [Feature], key: string): number {
    return geoms.map(g => g?.properties?.[key]).reduce((a: number, b: number) => a + b, 0);
  }

  // Reader for GeoJSON files under 1GB or so. Faster than the streaming reader.
  async readSmallGeoJson(path: string): Promise<FeatureCollection<Polygon, {}>> {
    const jsonString = readFileSync(path);
    return Promise.resolve(JSON.parse(jsonString.toString()));
  }

  // Streaming reader for GeoJSON files. Works on files over 1GB, but is slow.
  async readBigGeoJson(path: string): Promise<FeatureCollection<Polygon, {}>> {
    return new Promise(resolve =>
      createReadStream(path, { encoding: "utf8" })
        .pipe(parse("features"))
        .pipe(
          mapSync((features: any) => {
            resolve({ type: "FeatureCollection", features });
          })
        )
    );
  }

  // Write TopoJSON file to disk
  writeTopoJson(dir: string, topology: Topology<Objects<{}>>): void {
    this.log("Writing topojson file");
    writeFileSync(join(dir, "topo.json"), JSON.stringify(topology));
  }

  // Makes an appropriately-sized typed array containing the data
  mkTypedArray(data: readonly number[]): Uint8Array | Uint16Array | Uint32Array {
    // Can't use Math.max here, because it's a recursive function that will
    // reach a maximum call stack when working with large arrays.
    const maxVal = data.reduce((max, v) => (max >= v ? max : v), -Infinity);
    return maxVal <= 255
      ? new Uint8Array(data)
      : maxVal <= 65535
      ? new Uint16Array(data)
      : new Uint32Array(data);
  }

  // Create demographic static data and write to disk
  writeDemographicData(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevel: string,
    demographics: readonly string[]
  ): IStaticFile[] {
    const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
    return demographics.map(demographic => {
      this.log(`Writing static data file for ${demographic}`);
      const fileName = `${demographic}.buf`;

      // For demographic static data, we want an arraybuffer of base geounits where
      // each data element represents the demographic data contained in that geounit.
      const data = this.mkTypedArray(features.map(f => f?.properties?.[demographic]));
      writeFileSync(join(dir, fileName), data);
      return {
        id: demographic,
        fileName,
        bytesPerElement: data.BYTES_PER_ELEMENT
      };
    });
  }

  // Create geolevel index data and write to disk
  writeGeoLevelIndices(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevels: readonly string[]
  ): IStaticFile[] {
    const baseFeatures: Feature[] = (topology.objects[geoLevels[0]] as any).geometries;

    return geoLevels.slice(1).map(geoLevel => {
      this.log(`Writing ${geoLevel} index file`);
      const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
      const geoLevelIdToIndex = new Map(features.map((f, i) => [f?.properties?.[geoLevel], i]));
      const fileName = `${geoLevel}.buf`;

      // For geolevel static data, we want an arraybuffer of base geounits where
      // each data element represents the geolevel index of that geounit.
      const data = this.mkTypedArray(
        baseFeatures.map(f => {
          return geoLevelIdToIndex.get(f?.properties?.[geoLevel]) || 0;
        })
      );
      writeFileSync(join(dir, fileName), data);
      return {
        id: geoLevel,
        fileName,
        bytesPerElement: data.BYTES_PER_ELEMENT
      };
    });
  }

  // Write static metadata file to disk
  writeStaticMetadata(
    dir: string,
    demographicMetadata: IStaticFile[],
    geoLevelMetadata: IStaticFile[],
    bbox: [number, number, number, number],
    geoLevelHierarchy: GeoLevelInfo[]
  ): void {
    this.log("Writing static metadata file");
    const staticMetadata: IStaticMetadata = {
      demographics: demographicMetadata,
      geoLevels: geoLevelMetadata,
      bbox,
      geoLevelHierarchy
    };

    writeFileSync(join(dir, "static-metadata.json"), JSON.stringify(staticMetadata));
  }

  // Add index and parent geolevel indices to each geounit
  addGeoLevelIndices(topology: Topology<Objects<{}>>, geoLevels: readonly string[]): void {
    const descGeoLevels = geoLevels.slice().reverse();
    const parentGeoLevels: string[] = [];
    const indexLookupPerGeoLevel: {
      [geoLevel: string]: { [geounitId: string]: number };
    } = Object.fromEntries(descGeoLevels.map(gl => [gl, {}]));

    for (const geoLevel of descGeoLevels) {
      const topoObject: any = topology.objects[geoLevel];
      if (!parentGeoLevels.length) {
        // We're at the top-most geolevel, no parents, so we only need to add indices to lookup
        topoObject.geometries.forEach((geometry: any, index: number) => {
          const geounitId: string = geometry.properties[geoLevel];
          indexLookupPerGeoLevel[geoLevel][geounitId] = index;
          geometry.properties.idx = index;
        });
      } else {
        // Add indices to lookup, and update geom properties to have references to all parent ids
        const parentGeoLevel = parentGeoLevels[parentGeoLevels.length - 1];
        const grouped = groupBy(topoObject.geometries, f => f.properties[parentGeoLevel || ""]);
        for (const geoms of Object.values(grouped)) {
          geoms.forEach((geometry: any, index: number) => {
            const geounitId: string = geometry.properties[geoLevel];
            indexLookupPerGeoLevel[geoLevel][geounitId] = index;
            geometry.properties.idx = index;

            // Update geom properties with all references to parent ids in hierarchy
            for (const parentKey of parentGeoLevels) {
              geometry.properties[`${parentKey}Idx`] =
                indexLookupPerGeoLevel[parentKey][geometry.properties[parentKey]];
            }
          });
        }
      }
      parentGeoLevels.push(geoLevel);
    }
  }

  // Convert TopoJSON to GeoJSON and write to disk
  writeIntermediaryGeoJson(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevels: readonly string[]
  ): void {
    geoLevels.forEach(geoLevel => {
      this.log(`Converting topojson to geojson for ${geoLevel}`);
      const geojson = topo2feature(topology, topology.objects[geoLevel]);
      writeFileSync(join(dir, `${geoLevel}.geojson`), JSON.stringify(geojson));
    });
  }

  // Convert GeoJSON on disk to Vector Tiles
  writeVectorTiles(
    dir: string,
    geoLevels: readonly string[],
    minZooms: readonly string[],
    maxZooms: readonly string[]
  ): GeoLevelInfo[] {
    const joinedMbtiles = join(dir, "all-geounits.mbtiles");
    const inputs = geoLevels.map(geoLevel => join(dir, `${geoLevel}.geojson`));
    // Convert all layers to vector tiles in one go, to ensure simplification with
    // detection of shared borders applies to all layers at once
    //
    // This will cause tiles to include data beyond its min/max zoom, so we
    // strip those out in a later step
    this.log(`Converting geojson to vectortiles for ${geoLevels.join(", ")}`);
    // If we know the min/max zooms we can use them here and reduce memory/file
    // size, for automatic options like 'g' they'll only be used later
    const featureFilter = Object.fromEntries(
      geoLevels
        .map((geoLevel, idx) => {
          const minZoom = Number(minZooms[idx]);
          const maxZoom = Number(maxZooms[idx]);
          return isNaN(minZoom) && isNaN(maxZoom)
            ? undefined
            : isNaN(minZoom)
            ? [geoLevel, ["<=", "$zoom", maxZoom]]
            : isNaN(maxZoom)
            ? [geoLevel, [">=", "$zoom", minZoom]]
            : [geoLevel, ["all", [">=", "$zoom", minZoom], ["<=", "$zoom", maxZoom]]];
        })
        .filter(entries => entries !== undefined) as any
    );
    tippecanoe(inputs, {
      detectSharedBorders: true,
      featureFilter: JSON.stringify(featureFilter),
      force: true,
      // The only properties we want are geounit hierarchy indices
      include: [...geoLevels.slice(1).map(gl => `${gl}Idx`), "idx"],
      noTileCompression: true,
      noTinyPolygonReduction: true,
      dropRate: 1,
      output: joinedMbtiles,
      simplification: 10,
      simplifyOnlyLowZooms: true
    });
    const separateMbtiles = geoLevels.map(geoLevel => join(dir, `${geoLevel}.mbtiles`));
    const labelsGeojson = geoLevels.map(geoLevel => join(dir, `${geoLevel}-labels.geojson`));
    const labelsMbtiles = geoLevels.map(geoLevel => join(dir, `${geoLevel}-labels.mbtiles`));
    geoLevels.forEach((geoLevel, idx) => {
      const minimumZoom = minZooms[idx];
      const maximumZoom = maxZooms[idx];
      const input = join(dir, `${geoLevel}.geojson`);
      const output = separateMbtiles[idx];
      // Use tile-join to pull out individual layers and impose min/max zooms
      tileJoin([joinedMbtiles], {
        force: true,
        layer: geoLevel,
        maximumZoom,
        minimumZoom,
        noTileCompression: true,
        noTileSizeLimit: true,
        output
      });
      const labelPath = labelsGeojson[idx];
      const labelOutput = labelsMbtiles[idx];
      geojsonPolygonLabels(input, { style: "largest" }, { outputPath: labelPath });
      tippecanoe(labelPath, {
        force: true,
        maximumZoom,
        minimumZoom,
        noTileCompression: true,
        noTileSizeLimit: true,
        dropRate: 1,
        output: labelOutput
      });
    });

    const outputDir = join(dir, "tiles");
    tileJoin([...separateMbtiles, ...labelsMbtiles], {
      force: true,
      noTileCompression: true,
      noTileSizeLimit: true,
      outputToDirectory: outputDir
    });

    // Read the metadata json file created by tippecanoe, in order to extract geolevel zoom levels.
    // It is done in this manner, rather than pulling the zoom levels defined in the arguments to
    // this script, because it's possible to use zoom arguments such as 'g', which will request
    // tippecanoe to guess an appropriate zoom level. What's written out in the metadata file are
    // the actual zoom levels that were chosen.
    const tileMetadata = JSON.parse(readFileSync(join(outputDir, "metadata.json")).toString());

    // There is a `vector_layers` property that has a JSON string of additional layer information,
    // which needs to be parsed.
    const vectorLayers = JSON.parse(tileMetadata.json).vector_layers;

    // Put the layer information into a dictionary keyed by id for easier access.
    // We don't type information for what's in this file, so `any`s are used.
    // There are several fields defined, but we only care about: id, maxzoom, minzoom
    const layersById = vectorLayers.reduce((obj: any, item: any) => {
      obj[item.id] = item;
      return obj;
    }, {});

    return geoLevels.map(id => {
      const layerInfo = layersById[id];
      return {
        id: layerInfo.id,
        maxZoom: layerInfo.maxzoom,
        minZoom: layerInfo.minzoom
      };
    });
  }

  // Writes a slimmed down JSON hierarchy of geounits to disk
  writeGeounitHierarchy(dir: string, topology: Topology, geoLevels: readonly string[]): void {
    const definition = { groups: geoLevels.slice().reverse() };
    const geounitHierarchy = this.group(topology, definition);

    this.log("Writing geounit hierarchy file");
    writeFileSync(join(dir, "geounit-hierarchy.json"), JSON.stringify(geounitHierarchy));
  }

  // Groups a topology into a hierarchy of geounits corresponding to a district definition structure
  group(topology: Topology, definition: GeoUnitDefinition): HierarchyDefinition {
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
      this.getNode(geom, definition, Object.fromEntries(geounitsByParentId))
    );
  }

  // Helper for recursively collecting geounit hierarchy node information
  getNode(
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
    return remainingGroups.length > 1
      ? childGeoms.map(childGeom =>
          this.getNode(
            (childGeom as unknown) as GeometryObject<any>,
            { ...definition, groups: remainingGroups },
            geounitsByParentId
          )
        )
      : childGeoms.map((childGeom: any) => childGeom.id);
  }
}

function abbreviateNumber(value: number) {
  const suffixes = ["", "k", "m", "b", "t"];
  let shortValue = value.toPrecision(1);
  let suffixNum = 0;

  if (value >= 10) {
    suffixNum = Math.floor(Math.log10(value) / 3);
    const abbrevNum = value / Math.pow(1000, suffixNum);

    if (Math.log10(abbrevNum) >= 2) {
      shortValue = abbrevNum.toPrecision(3);
    } else {
      shortValue = abbrevNum.toPrecision(2);
    }
  }

  return shortValue + suffixes[suffixNum];
}
