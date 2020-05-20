import axios from "axios";
import { join } from "path";
import { parse } from "url";

import { HttpsURI, IStaticMetadata, S3URI } from "../shared/entities";

const s3Axios = axios.create();

export function s3ToHttps(path: S3URI): HttpsURI {
  const uri = parse(path);
  return join("https://", `${uri.host}.s3.amazonaws.com`, uri.path || "");
}

export async function fetchStaticMetadata(path: S3URI): Promise<IStaticMetadata> {
  return new Promise((resolve, reject) => {
    s3Axios
      .get(join(s3ToHttps(path), "static-metadata.json"))
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}
