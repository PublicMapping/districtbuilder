import { join } from "path";
import { parse } from "url";
import { HttpsURI, S3URI } from "../shared/entities";

export function s3ToHttps(path: S3URI): HttpsURI {
  const uri = parse(path);
  return join("https://", `${uri.host}.s3.amazonaws.com`, uri.path || "");
}
