import axios from "axios";
import { parse, resolve } from "url";

import {
  TypedArrays,
  GeoUnitHierarchy,
  HttpsURI,
  IStaticFile,
  IStaticMetadata,
  S3URI
} from "../shared/entities";
import { StaticProjectData, WorkerProjectData } from "./types";

const s3Axios = axios.create();

export function s3ToHttps(path: S3URI): HttpsURI {
  const uri = parse(path);
  return resolve(`https://${uri.host}.s3.amazonaws.com`, uri.path || "");
}

function staticDataUri(path: S3URI, fileName: string): HttpsURI {
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

async function fetchGeoUnitHierarchy(path: S3URI): Promise<GeoUnitHierarchy> {
  return new Promise((resolve, reject) => {
    s3Axios
      .get(staticDataUri(path, "geounit-hierarchy.json"))
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

async function fetchStaticFiles(path: S3URI, files: readonly IStaticFile[]): Promise<TypedArrays> {
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
            const unsigned = files[ind].unsigned;
            const typedArrayConstructor =
              unsigned || unsigned === undefined
                ? bpe === 1
                  ? Uint8Array
                  : bpe === 2
                  ? Uint16Array
                  : Uint32Array
                : bpe === 1
                ? Int8Array
                : bpe === 2
                ? Int16Array
                : Int32Array;

            const typedArray = new typedArrayConstructor(res.data);
            return typedArray;
          })
        )
      )
      .catch(error => reject(error.message));
  });
}

export async function fetchAllStaticData(path: S3URI): Promise<StaticProjectData> {
  return fetchStaticMetadata(path)
    .then(staticMetadata =>
      Promise.all([
        Promise.resolve(staticMetadata),
        fetchGeoUnitHierarchy(path),
        fetchStaticFiles(path, staticMetadata.geoLevels)
      ])
    )
    .then(([staticMetadata, geoUnitHierarchy, staticGeoLevels]) => ({
      staticMetadata,
      geoUnitHierarchy,
      staticGeoLevels
    }));
}

export async function fetchWorkerStaticData(
  path: S3URI,
  staticMetadata: IStaticMetadata
): Promise<WorkerProjectData> {
  return Promise.all([
    fetchGeoUnitHierarchy(path),
    fetchStaticFiles(path, staticMetadata.demographics),
    staticMetadata.voting && fetchStaticFiles(path, staticMetadata.voting)
  ]).then(([geoUnitHierarchy, staticDemographics, staticVotingData]) => ({
    geoUnitHierarchy,
    staticDemographics,
    staticVotingData
  }));
}
