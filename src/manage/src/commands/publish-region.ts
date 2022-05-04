import { Command, flags } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import S3 from "aws-sdk/clients/s3";
import cli from "cli-ux";
import { createReadStream } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import readDir from "recursive-readdir";
import { Topology } from "topojson-specification";
import { createConnection } from "typeorm";

import { RegionConfig } from "../../../server/src/region-configs/entities/region-config.entity";
import { getTopologyLayerSize } from "../../../server/src/common/functions";
import { connectionOptions } from "../lib/dbUtils";
import { shouldPublishFile } from "../lib/fileUtils";

export default class PublishRegion extends Command {
  static description = "upload processed region files to S3";

  static flags = {
    bucketName: flags.string({
      char: "b",
      description: "Bucket to upload the files to",
      default: "global-districtbuilder-dev-us-east-1"
    })
  };

  static args: IArg[] = [
    {
      name: "staticDataDir",
      description: "Directory of the region's static data (the output of `process-geojson`)",
      required: true
    },
    {
      name: "countryCode",
      description: "Country code, e.g. US",
      required: true
    },
    {
      name: "regionCode",
      description: "Region code, e.g. PA",
      required: true
    },
    {
      name: "regionName",
      description: "Name of the region, e.g. Pennsylvania",
      required: true
    }
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(PublishRegion);
    const versionDt = new Date();
    const keyPrefix = `regions/${args.countryCode}/${args.regionCode}/${versionDt.toISOString()}`;

    // Filter out intermediate data files that are no longer needed
    const filePaths = (await readDir(args.staticDataDir)).filter(shouldPublishFile);

    if (filePaths.length === 0) {
      this.log("no files found for publishing, exiting");
      return;
    }

    cli.action.start(`Uploading ${filePaths.length} files`);
    const s3Client = new S3();
    const uploadPromises = filePaths.map(filePath => {
      // Strip off relative parts of the path we don't need for use in the S3 key
      const keyName = join(keyPrefix, filePath.substring(args.staticDataDir.length));
      return s3Client
        .upload({
          Body: createReadStream(filePath),
          Bucket: flags.bucketName,
          Key: keyName
        })
        .promise();
    });
    const responses = await Promise.all(uploadPromises);
    cli.action.stop();
    this.log(`Received ${responses.length} responses`);

    const topology = JSON.parse(
      await readFile(join(args.staticDataDir, "topo.json"), { encoding: "utf-8" })
    ) as Topology;

    this.log("Saving region config to database");
    const regionConfig = new RegionConfig();
    regionConfig.name = args.regionName;
    regionConfig.countryCode = args.countryCode;
    regionConfig.regionCode = args.regionCode;
    regionConfig.s3URI = `s3://${flags.bucketName}/${keyPrefix}/`;
    regionConfig.version = versionDt;
    regionConfig.layerSizeInBytes = getTopologyLayerSize(topology);

    const connection = await createConnection(connectionOptions);
    const repo = connection.getRepository(RegionConfig);
    // @ts-ignore
    await repo.save(regionConfig);
    this.log("Region config saved to database");
  }
}
