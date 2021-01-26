declare module "geojson2shp" {
  import { GeoJSON } from "geojson";
  import * as stream from "stream";

  interface ConvertOptions {
    readonly layer?: string;
    readonly sourceCrs?: number;
    readonly targetCrs?: number;
  }

  export function convert(
    input: string | GeoJSON,
    output: string | stream.Writable,
    options?: ConvertOptions
  ): Promise<void>;
}
