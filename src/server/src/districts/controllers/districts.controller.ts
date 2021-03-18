import {
  Controller,
  InternalServerErrorException,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import csvParse from "csv-parse";
import { Express } from "express";
import { GeometryCollection } from "topojson-specification";

import {
  DistrictsDefinition,
  GeoUnitHierarchy,
  MutableGeoUnits
} from "../../../../shared/entities";
import { TopologyService } from "../services/topology.service";

import { RegionConfigsService } from "../../region-configs/services/region-configs.service";

const FIPS: { readonly [fips: string]: string } = {
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "74": "UM",
  "78": "VI",
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT"
};

@Controller("api/districts")
export class DistrictsController {
  constructor(
    public topologyService: TopologyService,
    private readonly regionConfigService: RegionConfigsService
  ) {}

  @UseInterceptors(FileInterceptor("file"))
  @Post("import/csv")
  @HttpCode(200)
  async exportCsv(@UploadedFile() file: Express.Multer.File): Promise<DistrictsDefinition> {
    const parser = csvParse(file.buffer, { fromLine: 2 });
    // Seemingly the simplest way of getting all the records into an array is to iterate in a for-loop :(
    /* eslint-disable */
    let records = [];
    for await (const record of parser) {
      records.push(record);
    }
    /* eslint-enable */
    const blockToDistricts = Object.fromEntries(records);

    const stateFips: string = records[0][0]?.slice(0, 2);
    if (!(stateFips in FIPS)) {
      throw new InternalServerErrorException();
    }
    const regionCode = FIPS[stateFips];
    const regionConfig = await this.regionConfigService.findOne({ regionCode, hidden: false });
    const geoCollection = regionConfig && (await this.topologyService.get(regionConfig.s3URI));
    if (!geoCollection) {
      throw new InternalServerErrorException();
    }
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitLayer = geoCollection.topology.objects[baseGeoLevel] as GeometryCollection;

    // The geounit hierarchy and district definition have the same structure (except the
    // hierarchy always goes out to the base geounit level), so we use it as a starting point
    // and transform it into our districts definition.
    const mapToDefinition = (hierarchySubset: GeoUnitHierarchy): DistrictsDefinition =>
      hierarchySubset.map((hierarchyNumOrArray, idx) => {
        if (typeof hierarchyNumOrArray === "number") {
          // The numbers found in the hierarchy are the base geounit indices of the topology.
          // Access this item in the topology to find it's base geounit id.
          // TODO (GH#629) error handling could be more comprehensive here
          const props: any = baseGeoUnitLayer.geometries[hierarchyNumOrArray].properties;
          const id = props[baseGeoLevel];
          return parseInt(blockToDistricts[id], 10);
        } else {
          // Keep recursing into the hierarchy until we reach the end
          const results = mapToDefinition(hierarchyNumOrArray);
          // Simplify if possible
          return results.every(item => item === results[0]) ? results[0] : results;
        }
      });

    return mapToDefinition(geoCollection.getGeoUnitHierarchy());
  }
}
