import S3, { GetObjectRequest } from "aws-sdk/clients/s3";
import { Request } from "aws-sdk/lib/request";
import { AWSError } from "aws-sdk/lib/error";

import { S3URI } from "../../../shared/entities";

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

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
