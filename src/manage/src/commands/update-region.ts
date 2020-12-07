import { Command } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import S3 from "aws-sdk/clients/s3";
import cli from "cli-ux";
import { createReadStream } from "fs";
import { join } from "path";
import readDir from "recursive-readdir";

export default class UpdateRegion extends Command {
  static description = "update processed region files in-place on S3";

  static args: IArg[] = [
    {
      name: "staticDataDir",
      description: "Directory of the region's static data (the output of `process-geojson`)",
      required: true
    },
    {
      name: "updateS3Dir",
      description: "S3 directory to update in-place",
      required: true
    }
  ];

  async run(): Promise<void> {
    const { args } = this.parse(UpdateRegion);

    // Filter out intermediate data files that are no longer needed
    const filePaths = (await readDir(args.staticDataDir)).filter(fileName => {
      return [".geojson", ".mbtiles"].every(ext => !fileName.endsWith(ext));
    });

    if (filePaths.length === 0) {
      this.log("no files found for updating, exiting");
      return;
    }

    cli.action.start(`Updating ${filePaths.length} files`);
    const uriComponents = args.updateS3Dir.split("/");
    const keyPrefix = uriComponents.slice(3).join("/");
    const s3Client = new S3();
    const uploadPromises = filePaths.map(filePath => {
      return s3Client
        .upload({
          Body: createReadStream(filePath),
          Bucket: uriComponents[2],
          Key: join(keyPrefix, filePath.substring(args.staticDataDir.length))
        })
        .promise();
    });
    const responses = await Promise.all(uploadPromises);
    cli.action.stop();
    this.log(`Received ${responses.length} responses`);
  }
}
