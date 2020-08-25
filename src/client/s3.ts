import axios from "axios";
import { parse, resolve } from "url";

import {
  UintArrays,
  GeoUnitHierarchy,
  HttpsURI,
  IStaticFile,
  IStaticMetadata,
  S3URI
} from "../shared/entities";

const s3Axios = axios.create();

export function s3ToHttps(path: S3URI): HttpsURI {
  const uri = parse(path);
  return resolve(`https://${uri.host}.s3.amazonaws.com`, uri.path || "");
}

export function staticDataUri(path: S3URI, fileName: string): HttpsURI {
  return resolve(s3ToHttps(path), fileName);
}

export async function fetchStaticMetadata(path: S3URI): Promise<IStaticMetadata> {
  return new Promise((resolve, reject) => {
    s3Axios
      .get(staticDataUri(path, "static-metadata.json"))
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchGeoUnitHierarchy(path: S3URI): Promise<GeoUnitHierarchy> {
  return new Promise((resolve, reject) => {
    s3Axios
      .get(staticDataUri(path, "geounit-hierarchy.json"))
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchStaticFiles(
  path: S3URI,
  files: readonly IStaticFile[]
): Promise<UintArrays> {
  const requests = files.map(fileMeta =>
    s3Axios.get(staticDataUri(path, fileMeta.fileName), {
      responseType: "arraybuffer"
    })
  );

  return new Promise((resolve, reject) => {
    axios
      .all(requests)
      .then(response =>
        resolve(
          response.map((res, ind) => {
            const bpe = files[ind].bytesPerElement;
            const typedArrayConstructor =
              bpe === 1 ? Uint8Array : bpe === 2 ? Uint16Array : Uint32Array;

            const typedArray = new typedArrayConstructor(res.data);
            return typedArray;
          })
        )
      )
      .catch(error => reject(error.message));
  });
}
