import { Command } from "@oclif/command";
import S3 from "aws-sdk/clients/s3";
import cli from "cli-ux";
import { mapSync } from "event-stream";
import { FeatureCollection, Polygon } from "geojson";
import { parse } from "JSONStream";
import { createReadStream } from "streamifier";
import { Objects, Topology } from "topojson-specification";
import { serialize } from "v8";

export default class SerializeTopojson extends Command {
  static description = `reprocess topojson files into binary format
  
  Pass a list of s3_uri paths to reprocess, e.g.
  serialize-topojson s3://bucket-name/regions/US/PA s3://other-bucket-name/regions/US/DE
`;

  static strict = false;

  // Streaming reader for GeoJSON files. Works on files over 512MB, but is slow.
  async readBigJson(path: string): Promise<FeatureCollection<Polygon, {}>> {
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

  async run(): Promise<void> {
    const { argv } = this.parse(SerializeTopojson);

    for (const s3URI of argv) {
      cli.action.start(`Reading base TopoJSON: ${s3URI}`);
      const baseTopojson = await this.readTopoJsonFromS3(s3URI);
      cli.action.stop();

      cli.action.start(`Uploading serialized TopoJSON: ${s3URI}`);
      await this.writeTopoJsonToS3(s3URI, baseTopojson);
      cli.action.stop();
    }
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

    const objects = await new Promise(resolve =>
      createReadStream(response.Body as Buffer)
        .pipe(parse("objects"))
        .pipe(
          mapSync((objects: any) => {
            resolve(objects);
          })
        )
    );

    const arcs = await new Promise(resolve =>
      createReadStream(response.Body as Buffer)
        .pipe(parse("arcs"))
        .pipe(
          mapSync((arcs: any) => {
            resolve(arcs);
          })
        )
    );

    const bbox = await new Promise(resolve =>
      createReadStream(response.Body as Buffer)
        .pipe(parse("bbox"))
        .pipe(
          mapSync((bbox: any) => {
            resolve(bbox);
          })
        )
    );

    const transform = await new Promise(resolve =>
      createReadStream(response.Body as Buffer)
        .pipe(parse("transform"))
        .pipe(
          mapSync((transform: any) => {
            resolve(transform);
          })
        )
    );

    return {
      type: "Topology",
      bbox,
      transform,
      objects,
      arcs
    } as Topology<Objects<{}>>;
  }

  // Write TopoJSON binary file to S3
  writeTopoJsonToS3(inputS3Dir: string, topology: Topology<Objects<{}>>) {
    this.log("Streaming topojson file");
    const uriComponents = inputS3Dir.split("/");
    const bucket = uriComponents[2];
    const key = `${uriComponents.slice(3).join("/")}topo.buf`;

    const s3Client = new S3();
    return s3Client
      .upload({
        Body: serialize(topology),
        Bucket: bucket,
        Key: key
      })
      .promise();
  }
}
