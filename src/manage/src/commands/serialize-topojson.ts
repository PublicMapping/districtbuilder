import { Command, flags } from "@oclif/command";
import S3 from "aws-sdk/clients/s3";
import cli from "cli-ux";
import { mapSync } from "event-stream";
import { parse } from "JSONStream";
import Pbf from "pbf";
import { createReadStream } from "streamifier";
import { Objects, Topology } from "topojson-specification";
import { serialize, deserialize } from "v8";
import { decode, encode } from "topobuf";

export default class SerializeTopojson extends Command {
  static description = `reprocess topojson files into binary format
  
  Pass a list of s3_uri paths to reprocess, e.g.
  serialize-topojson s3://bucket-name/regions/US/PA s3://other-bucket-name/regions/US/DE
`;

  static strict = false;

  static flags = {
    input: flags.string({
      char: "i",
      description: "File type to read from",
      options: ["buf", "json", "pbf"],
      default: "buf"
    }),
    output: flags.string({
      char: "o",
      description: "File type to write to",
      options: ["buf", "json", "pbf"],
      default: "pbf"
    })
  };

  async run(): Promise<void> {
    const { argv, flags } = this.parse(SerializeTopojson);
    if (flags.input === flags.output) {
      cli.error("Input and output file types cannot be the same");
    }

    for (const s3URI of argv) {
      cli.action.start(`Reading base TopoJSON: ${s3URI}`);
      const baseTopojson = await (flags.input === "json"
        ? this.readJson(s3URI)
        : flags.output === "buf"
        ? this.readBuf(s3URI)
        : this.readPbf(s3URI));
      cli.action.stop();

      cli.action.start(`Uploading serialized TopoJSON: ${s3URI}`);
      await (flags.output === "buf"
        ? this.writeBuf(s3URI, baseTopojson)
        : flags.output === "json"
        ? this.writeJson(s3URI, baseTopojson)
        : this.writePbf(s3URI, baseTopojson));
      cli.action.stop();
    }
  }

  // Reads a TopoJSON file from S3, given the S3 run directory
  async readJson(inputS3Dir: string): Promise<Topology<Objects<{}>>> {
    this.log("Reading topo.json");
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

  jsonOptions(inputS3Dir: string) {
    const uriComponents = inputS3Dir.split("/");
    return {
      Bucket: uriComponents[2],
      Key: `${uriComponents.slice(3).join("/")}topo.json`
    };
  }

  bufOptions(inputS3Dir: string) {
    const uriComponents = inputS3Dir.split("/");
    return {
      Bucket: uriComponents[2],
      Key: `${uriComponents.slice(3).join("/")}topo.buf`
    };
  }

  pbfOptions(inputS3Dir: string) {
    const uriComponents = inputS3Dir.split("/");
    return {
      Bucket: uriComponents[2],
      Key: `${uriComponents.slice(3).join("/")}topo.pbf`
    };
  }

  async readBuf(inputS3Dir: string) {
    this.log("Reading topo.buf");

    const s3Client = new S3();
    const resp = await s3Client.getObject(this.bufOptions(inputS3Dir)).promise();
    return deserialize(resp.Body as Buffer);
  }

  async readPbf(inputS3Dir: string) {
    this.log("Reading topo.buf");

    const s3Client = new S3();
    const resp = await s3Client.getObject(this.bufOptions(inputS3Dir)).promise();
    return decode(new Pbf(resp.Body as Buffer)) as Topology;
  }

  writeJson(inputS3Dir: string, topology: Topology<Objects<{}>>) {
    this.log("Streaming topo.json");
    const s3Client = new S3();
    return s3Client
      .upload({
        Body: JSON.stringify(topology),
        ...this.jsonOptions(inputS3Dir)
      })
      .promise();
  }

  writeBuf(inputS3Dir: string, topology: Topology<Objects<{}>>) {
    this.log("Streaming topo.buf");
    const s3Client = new S3();
    return s3Client
      .upload({
        Body: serialize(topology),
        ...this.bufOptions(inputS3Dir)
      })
      .promise();
  }

  writePbf(inputS3Dir: string, topology: Topology<Objects<{}>>) {
    this.log("Streaming topo.pbf");
    const s3Client = new S3();
    return s3Client
      .upload({
        Body: encode(topology, new Pbf()),
        ...this.pbfOptions(inputS3Dir)
      })
      .promise();
  }
}
