import { basename } from "path";

export function shouldPublishFile(fileName: string) {
  return (
    basename(fileName) === "input.geojson" ||
    [".geojson", ".mbtiles"].every(ext => !fileName.endsWith(ext))
  );
}
