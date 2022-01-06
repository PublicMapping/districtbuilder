import { Command, flags } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import S3 from "aws-sdk/clients/s3";
import cli from "cli-ux";
import { mapSync } from "event-stream";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync
} from "fs";
import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { parse } from "JSONStream";
import JsonStreamStringify from "json-stream-stringify";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import { join } from "path";
import { feature as topo2feature, mergeArcs, quantize } from "topojson-client";
import { topology } from "topojson-server";
import { planarTriangleArea, presimplify, simplify } from "topojson-simplify";
import { GeometryCollection, GeometryObject, Objects, Topology } from "topojson-specification";
import { serialize } from "v8";

import {
  TypedArray,
  GeoLevelInfo,
  GeoUnitDefinition,
  HierarchyDefinition,
  IStaticFile,
  IStaticMetadata,
  DemographicsGroup
} from "../../../shared/entities";
import { geojsonPolygonLabels, tileJoin, tippecanoe } from "../lib/cmd";

// Takes a comma-separated list of items, optionally as a pair separated by a ':'
// and returns an array
function splitPairs(input: string): readonly [string, string][] {
  return input.length === 0
    ? []
    : input
        .split(",")
        .map(item =>
          item.includes(":") ? (item.split(":", 2) as [string, string]) : [item, item]
        );
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays#typed_array_views
const UINT8_MAX = 255;
const UINT16_MAX = 65535;
const INT8_MIN = -128;
const INT8_MAX = 127;
const INT16_MIN = -32768;
const INT16_MAX = 32767;

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
      description: `Comma-separated geolevel hierarchy: smallest to largest
      To use a different name for the layer ID from the GeoJSON property, separate values by ':'
      e.g. -l geoid:block,blockgroupuuid:blockgroup,county
      `,
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
      description: `Comma-separated group of census demographics to select and aggregate
      To use a different name for the property from the GeoJSON property, separate values by ':'
      e.g. -d pop:population,wht:white,blk:black

      The first value in the group will be used as population, and the remaining values will be displayed
      as a percentage of that population.

      To create multiple groups, use the -d option once per group.
      e.g. -d population,white,black,asian,hispanic,other -d "VAP,VAP White, VAP Black, VAP Asian, VAP Hispanic, VAP Other" 
      `,
      default: "population,white,black,asian,hispanic,other",
      multiple: true
    } as const),

    voting: flags.string({
      char: "v",
      description: `Comma-separated election data to select and aggregate
      To use a different name for the layer property from the GeoJSON property, separate values by ':'
      e.g. -v voterep:republican,votedem:democrat,voteoth:other
      `,
      default: ""
    }),

    simplification: flags.string({
      char: "s",
      description: "Topojson simplification amount (minWeight)",
      default: "0.0000000025"
    }),

    quantization: flags.string({
      char: "q",
      description: "Topojson quantization transform, 0 to skip",
      default: "1e5"
    }),

    outputDir: flags.string({
      char: "o",
      description: "Directory to output files",
      default: "./"
    }),

    inputS3Dir: flags.string({
      char: "u",
      description: "S3 directory for the previous run if we will be updating in-place",
      default: ""
    }),

    filterPrefix: flags.string({
      char: "f",
      description: "Filter to only base geounits containing the specified prefix",
      default: ""
    })
  };

  static args: [IArg] = [{ name: "file", required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(ProcessGeojson);

    if (!existsSync(args.file)) {
      this.error(`file ${args.file} does not exist, exiting`);
    }

    if (!existsSync(flags.outputDir)) {
      this.error(`output directory ${flags.outputDir} does not exist, exiting`);
    }

    const geoLevels = splitPairs(flags.levels);
    const geoLevelIds = geoLevels.map(([, id]) => id);
    const voting = splitPairs(flags.voting);
    const votingIds = voting.map(([, id]) => id);
    const minZooms = flags.levelMinZoom.split(",");
    const maxZooms = flags.levelMaxZoom.split(",");
    // Setting 'multiple: true' makes this return an array, but the inferred type didn't get the message
    const demographicsFlags = flags.demographics as unknown as readonly string[];
    const demographics = splitPairs(demographicsFlags.join(","));
    const demographicIds = demographics.map(([, id]) => id);
    const simplification = parseFloat(flags.simplification);
    const quantization = parseFloat(flags.quantization);

    if (geoLevels.length !== minZooms.length || geoLevels.length !== maxZooms.length) {
      this.error(
        "'levels' 'levelMinZoom' and 'levelMaxZoom' must all have the same length, exiting"
      );
    }

    cli.action.start(`Reading base GeoJSON: ${args.file}`);
    const baseGeoJson = await (flags.big
      ? this.readBigGeoJson(args.file)
      : this.readSmallGeoJson(args.file));
    cli.action.stop();

    const numFeatures = baseGeoJson.features.length;
    this.log(`GeoJSON contains ${numFeatures.toString()} features`);
    if (numFeatures <= 0) {
      this.error(`GeoJSON must have features, exiting`);
    }

    const firstFeature = baseGeoJson.features[0];
    for (const [demo] of demographics) {
      if (!(demo in firstFeature.properties)) {
        this.error(`Demographic: "${demo}" not present in features, exiting`);
      }
    }
    for (const [prop] of geoLevels) {
      if (!(prop in firstFeature.properties)) {
        this.error(`Geolevel: "${prop}" not present in features, exiting`);
      }
    }
    for (const [prop] of voting) {
      if (!(prop in firstFeature.properties)) {
        this.error(`Voting data: "${prop}" not present in features, exiting`);
      }
    }

    this.renameProps(baseGeoJson, [...geoLevels, ...voting, ...demographics]);

    if (flags.filterPrefix) {
      this.log(`Filtering to only prefixes of: ${flags.filterPrefix}`);
      baseGeoJson.features = baseGeoJson.features.filter((f: any) =>
        f.properties[geoLevelIds[0]].startsWith(flags.filterPrefix)
      );
      this.log(`Filtered GeoJSON contains ${baseGeoJson.features.length.toString()} features`);
    }

    const topoJsonHierarchy = this.mkTopoJsonHierarchy(
      baseGeoJson,
      geoLevelIds,
      demographicIds,
      votingIds,
      simplification,
      quantization
    );

    const bbox = topoJsonHierarchy.bbox;
    if (bbox === undefined || bbox.length !== 4) {
      this.error(`Invalid bbox: "${bbox}"`);
    }

    if (!flags.inputS3Dir) {
      this.log("No inputS3Dir provided, no sorting needed");
    } else {
      cli.action.start("Pulling down previous TopoJSON for sorting");
      const prevTopoJson = await this.readTopoJsonFromS3(flags.inputS3Dir);
      cli.action.stop();

      this.log("Sorting TopoJSON based on previous version");
      const errorMessage = this.sortTopoJsonByPrev(topoJsonHierarchy, prevTopoJson, geoLevelIds);
      if (errorMessage !== null) {
        this.error(`Error encountered while sorting TopoJSON: "${errorMessage}"`);
      }
    }

    this.writeTopoJson(flags.outputDir, topoJsonHierarchy);

    this.addGeoLevelIndices(topoJsonHierarchy, geoLevelIds);

    // Include source geojson in output to make reprocessing easier
    this.log("Copying source file to output");
    copyFileSync(args.file, join(flags.outputDir, "input.geojson"));

    await this.writeIntermediaryGeoJson(flags.outputDir, topoJsonHierarchy, geoLevelIds);

    const geoLevelHierarchyInfo = this.writeVectorTiles(
      flags.outputDir,
      geoLevelIds,
      minZooms,
      maxZooms,
      demographicIds,
      votingIds
    );

    const demographicMetaData = this.writeNumericData(
      flags.outputDir,
      topoJsonHierarchy,
      geoLevelIds[0],
      demographicIds
    );

    const votingMetaData = this.writeNumericData(
      flags.outputDir,
      topoJsonHierarchy,
      geoLevelIds[0],
      votingIds
    );

    const geoLevelMetaData = this.writeGeoLevelIndices(
      flags.outputDir,
      topoJsonHierarchy,
      geoLevelIds
    );

    this.writeGeounitHierarchy(flags.outputDir, topoJsonHierarchy, geoLevelIds);

    this.writeStaticMetadata(
      flags.outputDir,
      demographicMetaData,
      geoLevelMetaData,
      votingMetaData,
      bbox,
      geoLevelHierarchyInfo,
      this.getDemographicsGroups(demographicsFlags)
    );
  }

  renameProps(
    baseGeoJson: FeatureCollection<Polygon, any>,
    props: readonly [string, string][]
  ): void {
    for (const [prop, id] of props) {
      if (prop !== id) {
        this.log(`Renaming ${prop} to ${id} for ${baseGeoJson.features.length} features`);
        for (const feature of baseGeoJson.features) {
          feature.properties[id] = feature.properties[prop];
          delete feature.properties[prop];
        }
      }
    }
  }

  getDemographicsGroups(demographicsFlags: readonly string[]): readonly DemographicsGroup[] {
    return demographicsFlags.map(flags => {
      const pairs = splitPairs(flags);
      const ids = pairs.map(([, id]) => id);
      const [total, ...subgroups] = ids;
      return { total, subgroups };
    });
  }

  // Generates a TopoJSON topology with aggregated hierarchical data
  mkTopoJsonHierarchy(
    baseGeoJson: FeatureCollection<Polygon, any>,
    geoLevelIds: readonly string[],
    demographics: readonly string[],
    voting: readonly string[],
    simplification: number,
    quantization: number
  ): Topology<Objects<{}>> {
    const baseGeoLevel = geoLevelIds[0];
    this.log(`Converting to topojson with base geolevel: ${baseGeoLevel}`);
    const baseTopoJson = topology({ [baseGeoLevel]: baseGeoJson });

    this.log("Presimplifying using planar triangle area");
    const preSimplifiedBaseTopoJson = presimplify(
      baseTopoJson as Topology<Objects<{}>>,
      planarTriangleArea
    );

    this.log(`Simplifying ${baseGeoLevel} geounits with minWeight: ${simplification}`);
    const simplified = simplify(preSimplifiedBaseTopoJson, simplification);

    if (quantization === 0) {
      this.log(`Skipping quantization`);
    } else {
      this.log(`Quantizing ${baseGeoLevel} geounits with transform: ${quantization}`);
    }
    const topo = quantization === 0 ? simplified : quantize(simplified, quantization);

    for (const [prevIndex, geoLevel] of geoLevelIds.slice(1).entries()) {
      const currIndex = prevIndex + 1;
      const currGeoLevel = geoLevelIds[currIndex];
      const prevGeoLevel = geoLevelIds[prevIndex];

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

        // It may be possible to do this without mutation, but it would require going
        // very against-the-grain with the topojson library, and would be less performant
        merged.properties = {};

        // Aggregate all desired demographic and voting data
        for (const ids of [demographics, voting]) {
          for (const id of ids) {
            merged.properties[id] = this.aggProperty(geoms, id);
          }
        }

        // Set the geolevel keys for this level, as well as all larger levels
        // e.g. if we're creating tracts, we want to store what tract this is for,
        // and also what county this tract belongs to. This is used for subsequent
        // hierarchy calculations, and is also needed by other parts of the
        // application, such as for constructing districs.
        //
        // Also copy the name field for this level as well as all larger levels
        for (const level of geoLevelIds.slice(currIndex)) {
          merged.properties[level] = firstGeom?.properties?.[level];

          const nameProp = `${level}_name`;
          if (firstGeom?.properties && nameProp in firstGeom.properties) {
            merged.properties[nameProp] = firstGeom.properties[nameProp];
            if (level === currGeoLevel) {
              merged.properties.name = firstGeom.properties[nameProp];
            }
          }
        }

        return merged;
      });

      topo.objects[currGeoLevel] = {
        type: "GeometryCollection",
        geometries: Object.values(mergedGeoms)
      };
    }
    // Add properties that should be available on every geometry
    for (const geoLevel of geoLevelIds) {
      const geomCollection = topo.objects[geoLevel] as GeometryCollection;
      geomCollection.geometries.forEach((geometry: GeometryObject, index) => {
        // Add an 'id' to each feature. This is implicit now but will
        // become necessary to index static data array buffers once the features
        // are converted into vector tiles.
        // We are using the id here, rather than a property, because an id is needed
        // in order to use the `setFeatureState` capability on the front-end.
        geometry.id = index;

        // Add abbreviated label
        for (const ids of [demographics, voting]) {
          for (const id of ids) {
            // @ts-ignore
            geometry.properties[`${id}-abbrev`] = abbreviateNumber(geometry.properties[id]);
          }
        }

        // Add name if it is not already defined
        // Blocks and block groups have their FIPS code available at geometry.proprties.block[group]
        // so we can use that for the name so that the label is something useful.
        if (geometry.properties && !("name" in geometry.properties)) {
          // @ts-ignore
          const levelFips = geometry.properties[geoLevel];
          // FIPS Code format is:
          // AABBBCCCCCCDEEE
          // A = State code
          // B = County code
          // C = Tract code
          // D = Blockgroup code
          // E = Block code
          // We display blocks and blockgroups but not tracts, so we're using the following subsets
          // of the full FIPS code for each level:
          // Blockgroup: Tract code and blockgroup code (CCCCCCD)
          // Block: Blockgroup code and block code (DEEE)
          // Counties are displayed with their name.
          const localFips =
            geoLevel === "blockgroup"
              ? levelFips.substring(5)
              : geoLevel === "block"
              ? levelFips.substring(11)
              : levelFips;
          // And then we want the tooltip to display something like "Blockgroup #CCCCCCD"
          // @ts-ignore
          geometry.properties.name = `${
            geoLevel[0].toUpperCase() + geoLevel.substring(1)
          } #${localFips}`;
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

  // Reads a TopoJSON file from S3, given the S3 run directory
  async readTopoJsonFromS3(inputS3Dir: string): Promise<Topology<Objects<{}>>> {
    const uriComponents = inputS3Dir.split("/");
    const bucket = uriComponents[2];
    const key = `${uriComponents.slice(3).join("/")}topo.json`;
    const response: any = await new S3()
      .getObject({
        Bucket: bucket,
        Key: key
      })
      .promise();

    // Note: we are not using streaming within the server when reading TopoJSON, so it hasn't been
    // implemented that way here either. If we ever encounter a TopoJSON file that's large enough
    // that it needs to be streamed, we'll need to convert both pieces of code appropriately.
    return JSON.parse(response.Body.toString("utf8"));
  }

  // Write TopoJSON file to disk
  writeTopoJson(dir: string, topology: Topology<Objects<{}>>) {
    this.log("Writing topojson file");
    const path = join(dir, "topo.buf");
    const output = createWriteStream(path, { encoding: "binary" });
    output.write(serialize(topology));
    output.close();
  }

  // Makes an appropriately-sized typed array containing the data
  mkTypedArray(data: readonly number[]): TypedArray {
    // Can't use Math.max / Math.min here, because it's a recursive function that will
    // reach a maximum call stack when working with large arrays.
    const maxVal = data.reduce((max, v) => (max >= v ? max : v), -Infinity);
    const minVal = data.reduce((min, v) => (min <= v ? min : v), Infinity);
    return minVal >= 0
      ? maxVal <= UINT8_MAX
        ? new Uint8Array(data)
        : maxVal <= UINT16_MAX
        ? new Uint16Array(data)
        : new Uint32Array(data)
      : minVal >= INT8_MIN && maxVal <= INT8_MAX
      ? new Int8Array(data)
      : minVal >= INT16_MIN && maxVal <= INT16_MAX
      ? new Int16Array(data)
      : new Int32Array(data);
  }

  // Create demographic or voting static data and write to disk
  writeNumericData(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevel: string,
    ids: readonly string[]
  ): IStaticFile[] {
    const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
    return ids.map(id => {
      this.log(`Writing static data file for ${id}`);
      const fileName = `${id}.buf`;

      // For demographic static data, we want an arraybuffer of base geounits where
      // each data element represents the demographic data contained in that geounit.
      const data = features.map(f => f?.properties?.[id]);
      const typedData = this.mkTypedArray(data);
      writeFileSync(join(dir, fileName), typedData);
      return {
        id,
        fileName,
        bytesPerElement: typedData.BYTES_PER_ELEMENT,
        unsigned:
          typedData instanceof Uint8Array ||
          typedData instanceof Uint16Array ||
          typedData instanceof Uint32Array
      };
    });
  }

  // Create geolevel index data and write to disk
  writeGeoLevelIndices(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevels: readonly string[]
  ): IStaticFile[] {
    return geoLevels.slice(1).map((geoLevel, idx) => {
      this.log(`Writing ${geoLevel} index file`);
      const childFeatures: Feature[] = (topology.objects[geoLevels[idx]] as any).geometries;
      const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
      const geoLevelIdToIndex = new Map(features.map((f, i) => [f?.properties?.[geoLevel], i]));
      const fileName = `${geoLevel}.buf`;

      // For geolevel static data, we want an arraybuffer of child geounits where
      // each data element represents the geolevel index of that geounit.
      // For example, for county-tract-block:
      //  - county.buf is a list of tracts where each value is the county index the tract belongs to
      //  - tract.buf is a list of blocks where each value is the tract index the block belongs to
      // With this information, we're able to answer questions such as:
      //  - Given a county id, which tracts belong to it?
      //  - Given a tract id, which blocks belong to it?
      const data = this.mkTypedArray(
        childFeatures.map(f => {
          return geoLevelIdToIndex.get(f?.properties?.[geoLevel]) || 0;
        })
      );
      writeFileSync(join(dir, fileName), data);
      return {
        id: geoLevel,
        fileName,
        bytesPerElement: data.BYTES_PER_ELEMENT,
        unsigned: true
      };
    });
  }

  // Write static metadata file to disk
  writeStaticMetadata(
    dir: string,
    demographicMetadata: IStaticFile[],
    geoLevelMetadata: IStaticFile[],
    votingMetadata: IStaticFile[],
    bbox: [number, number, number, number],
    geoLevelHierarchy: GeoLevelInfo[],
    demographicsGroups: readonly DemographicsGroup[]
  ): void {
    this.log("Writing static metadata file");
    const staticMetadata: IStaticMetadata = {
      demographics: demographicMetadata,
      geoLevels: geoLevelMetadata,
      voting: votingMetadata,
      bbox,
      geoLevelHierarchy,
      demographicsGroups
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
  ): Promise<void[]> {
    const promises = geoLevels.map(geoLevel => {
      this.log(`Converting topojson to geojson for ${geoLevel}`);
      const geojson = topo2feature(topology, topology.objects[geoLevel]);
      const path = join(dir, `${geoLevel}.geojson`);
      const output = createWriteStream(path, { encoding: "utf8" });
      return new Promise<void>(resolve =>
        new JsonStreamStringify(geojson).pipe(output).on("finish", () => resolve(void 0))
      );
    });
    this.log("Streaming geojson to disk");
    return Promise.all(promises);
  }

  // Convert GeoJSON on disk to Vector Tiles
  writeVectorTiles(
    dir: string,
    geoLevels: readonly string[],
    minZooms: readonly string[],
    maxZooms: readonly string[],
    demographics: readonly string[],
    voting: readonly string[]
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
      // The only properties we want are geounit hierarchy indices and optionally the name
      include: [...geoLevels.slice(1).map(gl => `${gl}Idx`), "idx", "name"],
      noTileCompression: true,
      noTinyPolygonReduction: true,
      dropRate: 1,
      output: joinedMbtiles,
      simplification: 4,
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
        include: [...demographics.map(id => `${id}-abbrev`), ...voting.map(id => `${id}-abbrev`)],
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
          mutableMappings[geometry.properties[groupName]].push(geometry as unknown as Polygon);
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
            childGeom as unknown as GeometryObject<any>,
            { ...definition, groups: remainingGroups },
            geounitsByParentId
          )
        )
      : childGeoms.map((childGeom: any) => childGeom.id);
  }

  // Sorts TopoJSON in the same order as a reference TopoJSON and performs structural checks
  sortTopoJsonByPrev(
    newTopoJson: Topology<Objects<{}>>,
    prevTopoJson: Topology<Objects<{}>>,
    geoLevelIds: readonly string[]
  ): string | null {
    const baseLevel = geoLevelIds[0];
    for (const level of geoLevelIds) {
      this.log(`Sorting geolevel: ${level}`);
      const newFeatures = (newTopoJson.objects[level] as any).geometries;
      const prevFeatures = (prevTopoJson.objects[level] as any).geometries;
      if (newFeatures.length !== prevFeatures.length) {
        return `feature count was: ${prevFeatures.length}, and is now: ${newFeatures.length}`;
      }

      // For the previous TopoJSON, create a map of geounit id => index, so we can sort quickly
      const prevIndexMap = prevFeatures.reduce(
        (acc: Map<string, number>, feature: any, index: number) =>
          acc.set(feature.properties[level], index),
        new Map()
      );

      // Sort new TopoJSON using previous TopoJSON indices as a reference
      newFeatures.sort((x: any, y: any) =>
        prevIndexMap.get(x.properties[level]) > prevIndexMap.get(y.properties[level]) ? 1 : -1
      );

      // Check that all geolevel attributes are the same between new and previous.
      // Any differences indicate a change in structure, and we can't continue.
      for (let i = 0; i < newFeatures.length; i++) {
        const newProperties = newFeatures[i].properties;
        const prevProperties = prevFeatures[i].properties;
        const baseId = newProperties[baseLevel];
        for (const geoLevel of geoLevelIds) {
          const newProp = newProperties[geoLevel];
          const prevProp = prevProperties[geoLevel];
          if (newProp !== prevProp) {
            return `new ${geoLevel} is: ${newProp}, was: ${prevProp} for ${baseLevel}: ${baseId}`;
          }
        }
      }
    }

    // A return of null means no errors have been encountered
    return null;
  }
}

export function abbreviateNumber(value: number) {
  const suffixes = ["", "k", "m", "b", "t"];
  let shortValue = value.toPrecision(1);
  let suffixNum = 0;

  if (Math.abs(value) >= 10) {
    suffixNum = Math.floor(Math.log10(Math.abs(value)) / 3);
    const abbrevNum = value / Math.pow(1000, suffixNum);

    if (Math.log10(Math.abs(abbrevNum)) >= 2) {
      shortValue = abbrevNum.toPrecision(3);
    } else {
      shortValue = abbrevNum.toPrecision(2);
    }

    // Get rid of exponential notation in certain cases. For example:
    // > (99.5).toPrecision(2)
    // '1.0e+2'
    // > Number((99.5).toPrecision(2)).toString()
    // '100'
    shortValue = Number(shortValue).toString();

    // Account for case where result would be off due to rounding from `toPrecision` (eg. "1000k")
    // by moving up to the next thousands place.
    if (Math.abs(Number(shortValue)) === 1000) {
      shortValue = (Number(shortValue) / 1000).toString();
      suffixNum += 1;
    }
  }

  return shortValue + suffixes[suffixNum];
}
