import { Command, flags } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import { existsSync, readFileSync, mkdirSync } from "fs";
import UpdateRegion from "./update-region";
import ProcessGeojson from "./process-geojson";

interface RegionConfig {
  geojsonFile: string;
  updateS3Dir: string;
  processGeojsonFlags?: string[];
}

interface ProcessingConfig {
  // Country code
  [key: string]: {
    // Region code
    [key: string]: RegionConfig;
  };
}

export default class BulkReprocessRegions extends Command {
  static description = `use a configuration file to process and update many regions`;

  static flags = {
    dryRun: flags.boolean({
      allowNo: false,
      description: `Dry run; only prints actions that would be taken.`
    })
  };
  static args: [IArg] = [
    {
      name: "configFile",
      required: true,
      description: `Path to a configuration file containing information on how each region should be processed.

The configuration file should be a JSON file with the following format:
{
  "US": {
    "DE": {
      "geojsonFile": "data/input/de.geojson",
      "updateS3Dir": "s3://path/to/timestamped/data/files/like/US/DE/2021-09-23T18:43:42.300Z/",
      "processGeojsonFlags": [
        "-n",
        "12,4,4",
        "-x",
        "12,12,12",
        "-d",
        "population,white,black,asian,hispanic,native:nativeAmerican,pacific:pacificIslander"
      ]
    }
  }
}

Within each state, the parameters are as follows:
- geojsonFile: Behaves identically to the equivalent parameter to the process-geojson command
- updateS3Dir: Behaves identically to the equivalent parameter to the update-region command, and is also used as the --inputS3Dir to process-geojson.
- processGeojsonFlags: All flags that could be passed to the process-geojson command are valid EXCEPT --inputS3Dir; flags should be entered as an array of strings.
`
    }
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(BulkReprocessRegions);
    // Invert dryRun for cleaner expressions
    const doWork = !flags.dryRun;

    flags.dryRun && this.log("--dryRun passed; no changes will be made");
    if (!existsSync(args.configFile)) {
      this.error(`config_file ${args.configFile} does not exist, exiting`);
    }

    const processingConfig: ProcessingConfig = JSON.parse(readFileSync(args.configFile, "utf8"));

    for (const [countryCode, regions] of Object.entries(processingConfig)) {
      for (const [regionCode, regionConfig] of Object.entries(regions)) {
        const outputDir = `data/output/${countryCode}/${regionCode}/`;
        this.log(`Creating output directory ${outputDir}`);
        doWork && mkdirSync(outputDir, { recursive: true });

        this.log(`Processing ${regionConfig.geojsonFile} to ${outputDir}`);
        try {
          doWork &&
            (await ProcessGeojson.run(
              [
                regionConfig.geojsonFile,
                `--outputDir=${outputDir}`,
                // Since we know we're updating in-place, we need to pass inputS3Dir with the same path as the updateS3Dir
                `--inputS3Dir=${regionConfig.updateS3Dir}`
              ].concat(regionConfig.processGeojsonFlags ? regionConfig.processGeojsonFlags : [])
            ));
        } catch {
          this.warn(`Processing ${regionCode} failed; not updating S3`);
          continue;
        }
        this.log(`Updating ${regionConfig.updateS3Dir}`);
        doWork && (await UpdateRegion.run([outputDir, regionConfig.updateS3Dir]));
      }
    }
    this.log("Done.");
  }
}
