import S3, { GetObjectRequest } from "aws-sdk/clients/s3";
import { Request } from "aws-sdk/lib/request";
import { AWSError } from "aws-sdk/lib/error";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { Topology } from "topojson-specification";
import { deserialize } from "v8";

import { IRegionConfig, S3URI } from "../../../shared/entities";

const TOPOLOGY_CACHE_DIRECTORY = process.env.TOPOLOGY_CACHE_DIRECTORY || "/tmp";

export function s3Options(path: S3URI, fileName: string): GetObjectRequest {
  const url = new URL(path);
  const pathWithoutLeadingSlash = url.pathname.substring(1);
  const options = { Bucket: url.hostname, Key: `${pathWithoutLeadingSlash}${fileName}` };
  return options;
}

// Wraps S3.getObject to optionally allow for unauthenticated requests
export function getObject(s3: S3, req: GetObjectRequest): Promise<S3.Types.GetObjectOutput> {
  const request: Request<S3.Types.GetObjectOutput, AWSError> = s3.config.credentials
    ? s3.getObject(req)
    : s3.makeUnauthenticatedRequest("getObject", req);
  return request.promise();
}

// Gets the specified topology, downloading it from S3 and caching it locally if it is not already cached
export async function getTopology(s3: S3, regionConfig: IRegionConfig): Promise<Topology> {
  const folderPath = join(TOPOLOGY_CACHE_DIRECTORY, regionConfig.id);
  const filePath = join(folderPath, "topo.buf");

  async function downloadTopology() {
    const topojsonResponse = await getObject(s3, s3Options(regionConfig.s3URI, "topo.buf"));
    const buffer = topojsonResponse.Body as Buffer;
    // Save file to disk for speedier access later
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }
    await writeFile(filePath, buffer, "binary");
    return buffer;
  }

  // Load from disk first, download if not present
  const buffer = await (existsSync(filePath) ? readFile(filePath) : downloadTopology());
  return deserialize(buffer) as Topology;
}

export async function getTopologyFromDisk(regionConfig: IRegionConfig): Promise<Topology> {
  const filePath = join(TOPOLOGY_CACHE_DIRECTORY, regionConfig.id, "topo.buf");
  const topologyBuffer = await readFile(filePath);
  return deserialize(topologyBuffer) as Topology;
}
