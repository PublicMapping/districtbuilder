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

import {
  DistrictsDefinition,
  GeoUnitHierarchy,
  ImportRowFlag,
  DistrictsImportApiResponse,
  DistrictImportField
} from "../../../../shared/entities";
import { FIPS } from "../../../../shared/constants";
import {} from "../../../../shared/entities";
import { TopologyService } from "../services/topology.service";

import { RegionConfigsService } from "../../region-configs/services/region-configs.service";

@Controller("api/districts")
export class DistrictsController {
  constructor(
    public topologyService: TopologyService,
    private readonly regionConfigService: RegionConfigsService
  ) {}

  @UseInterceptors(FileInterceptor("file"))
  @Post("import/csv")
  @HttpCode(200)
  async importCsv(@UploadedFile() file: Express.Multer.File): Promise<DistrictsImportApiResponse> {
    /* eslint-disable */
    const parser = csvParse(file.buffer, { fromLine: 2 });
    let records = [];
    // Seemingly the simplest way of getting all the records into an array is to iterate in a for-loop :(
    for await (const record of parser) {
      records.push(record);
    }
    /* eslint-enable */

    // Array of flagged rows to be returned
    let flaggedRows: ImportRowFlag[] = [];
    let matchingRows: boolean[] = [];
    let maxDistrictId: number = 0;

    function setFlag(
      row: readonly string[],
      rowNumber: number,
      field: DistrictImportField,
      errorText: string
    ) {
      const flag = { rowNumber: rowNumber, errorText: errorText, rowValue: row, field: field };
      flaggedRows[rowNumber] = flag;
    }
    const stateFips: string = records[0][0]?.slice(0, 2);
    if (!(stateFips in FIPS)) {
      throw new InternalServerErrorException();
    }
    const blockIdCounts: {
      [blockId: string]: number;
    } = {};

    // Iterate through records again to flag invalid rows
    records.forEach((record, i) => {
      const rowFips = record[0]?.slice(0, 2);
      const blockId = record[0];
      // eslint-disable-next-line
      blockIdCounts[blockId] = blockIdCounts[blockId] ? blockIdCounts[blockId] + 1 : 1;
      // Check to see if row fips is valid
      if (!(rowFips in FIPS)) {
        setFlag(record, i, "BLOCKID", "Invalid FIPS code");
      }

      // Check to see if rows match state fips
      if (rowFips !== stateFips && !flaggedRows[i]) {
        setFlag(record, i, "BLOCKID", "All geounits in an import must be within the same state");
      }

      // Check for duplicate block IDs
      if (blockIdCounts[blockId] > 1 && !flaggedRows[i]) {
        setFlag(record, i, "BLOCKID", "Duplicate BLOCKID included in import");
      }

      if (isNaN(record[1]) && !flaggedRows[i]) {
        setFlag(record, i, "DISTRICT", "Invalid district ID, must be numeric");
      }
    });

    const unflaggedRows = records.filter((record, i) => !flaggedRows[i]);

    const blockToDistricts = Object.fromEntries(unflaggedRows);

    const regionCode = FIPS[stateFips];
    const regionConfig = await this.regionConfigService.findOne({
      regionCode,
      hidden: false,
      archived: false
    });
    const geoCollection = regionConfig && (await this.topologyService.get(regionConfig.s3URI));
    if (!geoCollection) {
      throw new InternalServerErrorException();
    }
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitProperties = geoCollection.topologyProperties[baseGeoLevel];

    // The geounit hierarchy and district definition have the same structure (except the
    // hierarchy always goes out to the base geounit level), so we use it as a starting point
    // and transform it into our districts definition.
    const mapToDefinition = (hierarchySubset: GeoUnitHierarchy): DistrictsDefinition =>
      hierarchySubset.map(hierarchyNumOrArray => {
        if (typeof hierarchyNumOrArray === "number") {
          // The numbers found in the hierarchy are the base geounit indices of the topology.
          // Access this item in the topology to find it's base geounit id.
          const props: any = baseGeoUnitProperties[hierarchyNumOrArray];
          const id = props[baseGeoLevel];
          const districtAssignment = parseInt(blockToDistricts[id], 10);
          if (blockToDistricts[id]) {
            // Allow editing of matching rows object
            // eslint-disable-next-line
            matchingRows[id] = true;
          }
          if (districtAssignment > maxDistrictId) {
            maxDistrictId = districtAssignment;
          }
          return !isNaN(districtAssignment) ? districtAssignment : 0;
        } else {
          // Keep recursing into the hierarchy until we reach the end
          const results = mapToDefinition(hierarchyNumOrArray);
          // Simplify if possible
          return results.every(item => item === results[0]) ? results[0] : results;
        }
      });

    const districtsDefinition = mapToDefinition(geoCollection.hierarchyDefinition);
    // Find unmatched records
    records.forEach((record, i) => {
      if (!matchingRows[record[0]] && !flaggedRows[i]) {
        setFlag(record, i, "BLOCKID", "Invalid block ID");
      }
    });

    const rowFlags = flaggedRows.filter(r => !!r);

    return {
      districtsDefinition: districtsDefinition,
      maxDistrictId: maxDistrictId,
      rowFlags: rowFlags.length > 0 ? rowFlags : undefined
    };
  }
}
