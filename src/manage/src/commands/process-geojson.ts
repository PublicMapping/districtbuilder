import { Command, flags } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import cli from "cli-ux";
import { mapSync } from "event-stream";
import { createReadStream, readFileSync, writeFileSync } from "fs";
import { Feature, FeatureCollection, Polygon } from "geojson";
import { parse } from "JSONStream";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import { join } from "path";
import {
  feature as topo2feature,
  mergeArcs,
  planarTriangleArea,
  presimplify,
  simplify,
  topology
} from "topojson";
import { Geometry, GeometryCollection, Objects, Topology } from "topojson-specification";
import { IStaticMetadata } from "../../../shared/entities";
import { tileJoin, tippecanoe } from "../lib/cmd";

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
      default: "0.001"
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

    this.writeTopoJson(flags.outputDir, topoJsonHierarchy);

    this.writeIntermediaryGeoJson(flags.outputDir, topoJsonHierarchy, geoLevels);

    this.writeVectorTiles(flags.outputDir, geoLevels, minZooms, maxZooms);

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

    this.writeStaticMetadata(flags.outputDir, demographicMetaData, geoLevelMetaData);
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
      geomCollection.geometries.forEach((geometry: Geometry, index) => {
        // tslint:disable-next-line:no-object-mutation
        geometry.id = index;
      });
    }

    return topo;
  }

  // Helper for aggregating properties by addition
  aggProperty(geoms: readonly [Feature], key: string): number {
    return geoms.map(g => g?.properties?.[key]).reduce((a, b) => a + b, 0);
  }

  // Reader for GeoJSON files under 1GB or so. Faster than the streaming reader.
  async readSmallGeoJson(path: string): Promise<FeatureCollection<Polygon, {}>> {
    const jsonString = readFileSync(path);
    return JSON.parse(jsonString.toString());
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
  ): IStaticMetadata[] {
    const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
    return demographics.map(demographic => {
      this.log(`Writing static data file for ${demographic}`);
      const fileName = `${demographic}.buf`;

      // For demographic static data, we want an arraybuffer of base geounits where
      // each data element represents the demographic data contained in that geounit.
      const data = this.mkTypedArray(features.map(f => f.properties[demographic]));
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
  ): IStaticMetadata[] {
    const baseFeatures: Feature[] = (topology.objects[geoLevels[0]] as any).geometries;

    return geoLevels.slice(1).map(geoLevel => {
      this.log(`Writing ${geoLevel} index file`);
      const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
      const geoLevelIdToIndex = new Map(features.map((f, i) => [f.properties[geoLevel], i]));
      const fileName = `${geoLevel}.buf`;

      // For geolevel static data, we want an arraybuffer of base geounits where
      // each data element represents the geolevel index of that geounit.
      const data = this.mkTypedArray(
        baseFeatures.map(f => {
          return geoLevelIdToIndex.get(f.properties[geoLevel]);
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
    demographicMetadata: IStaticMetadata,
    geoLevelMetadata: IStaticMetadata
  ): void {
    this.log("Writing static metadata file");
    writeFileSync(
      join(dir, "static-metadata.json"),
      JSON.stringify({
        demographics: demographicMetadata,
        geoLevels: geoLevelMetadata
      })
    );
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
  ): void {
    const mbtiles = geoLevels.map(geoLevel => join(dir, `${geoLevel}.mbtiles`));
    geoLevels.forEach((geoLevel, idx) => {
      const minimumZoom = minZooms[idx];
      const maximumZoom = maxZooms[idx];
      const output = mbtiles[idx];
      this.log(`Converting geojson to vectortiles for ${geoLevel}`);
      tippecanoe(
        [join(dir, `${geoLevel}.geojson`)],
        {
          detectSharedBorders: true,
          force: true,
          maximumZoom,
          minimumZoom,
          noTileCompression: true,
          noTinyPolygonReduction: true,
          output,
          simplification: 15,
          simplifyOnlyLowZooms: true
        },
        { echo: true }
      );
    });

    const outputDir = join(dir, "tiles");
    tileJoin(
      mbtiles,
      { force: true, noTileCompression: true, noTileSizeLimit: true, outputToDirectory: outputDir },
      { echo: true }
    );
  }
}
