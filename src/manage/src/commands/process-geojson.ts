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
import { mergeArcs, planarTriangleArea, presimplify, simplify, topology } from "topojson";
import { Objects, Topology } from "topojson-specification";

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
    const demographics = flags.demographics.split(",");
    const simplification = parseFloat(flags.simplification);

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
    this.writeDemographicData(flags.outputDir, topoJsonHierarchy, geoLevels[0], demographics);
    this.writeGeoLevelIndices(flags.outputDir, topoJsonHierarchy, geoLevels);
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
    writeFileSync(join(dir, "topo.json"), JSON.stringify(topology));
  }

  // Create demographic static data and write to disk
  writeDemographicData(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevel: string,
    demographics: readonly string[]
  ): void {
    const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
    demographics.forEach(demographic => {
      this.log(`Writing static data file for ${demographic}`);
      writeFileSync(
        join(dir, `${demographic}.buf`),
        new Uint16Array(features.map(f => f.properties[demographic]))
      );
    });
  }

  // Create geolevel index data and write to disk
  writeGeoLevelIndices(
    dir: string,
    topology: Topology<Objects<{}>>,
    geoLevels: readonly string[]
  ): void {
    const baseFeatures: Feature[] = (topology.objects[geoLevels[0]] as any).geometries;

    geoLevels.slice(1).forEach(geoLevel => {
      const features: Feature[] = (topology.objects[geoLevel] as any).geometries;
      const geoLevelIdToIndex = new Map(features.map((f, i) => [f.properties[geoLevel], i]));
      const data = baseFeatures.map(f => {
        return geoLevelIdToIndex.get(f.properties[geoLevel]);
      });

      this.log(`Writing ${geoLevel} index file`);
      writeFileSync(join(dir, `${geoLevel}.buf`), new Uint16Array(data));
    });
  }
}
