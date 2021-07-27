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
    let records: [string, string][] = [];
    // Seemingly the simplest way of getting all the records into an array is to iterate in a for-loop :(
    for await (const record of parser) {
      records.push(record);
    }
    /* eslint-enable */

    // Array of flagged rows to be returned
    let flaggedRows: ImportRowFlag[] = [];

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

      if (isNaN(Number(record[1])) && !flaggedRows[i]) {
        setFlag(record, i, "DISTRICT", "Invalid district ID, must be numeric");
      }
    });

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
    if (!("topology" in geoCollection)) {
      // Only unarchived regions support imports
      throw new InternalServerErrorException();
    }

    const unflaggedRows = records.filter((record, i) => !flaggedRows[i]);
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitProperties = geoCollection.topologyProperties[baseGeoLevel];

    const blockToDistricts = Object.fromEntries(
      unflaggedRows.map(([block, district]) => [block, Number(district)])
    );
    const districtsDefinition = geoCollection.importFromCSV(blockToDistricts);

    // Find unmatched records
    const allBlockIds = new Set(baseGeoUnitProperties.map((props: any) => props[baseGeoLevel]));
    records.forEach((record, i) => {
      if (!allBlockIds.has(record[0]) && !flaggedRows[i]) {
        setFlag(record, i, "BLOCKID", "Invalid block ID");
      }
    });

    const maxDistrictId = Math.max(
      ...districtsDefinition.flat(geoCollection.staticMetadata.geoLevels.length)
    );
    const rowFlags = flaggedRows.filter(r => !!r);

    return {
      districtsDefinition: districtsDefinition,
      maxDistrictId: maxDistrictId,
      rowFlags: rowFlags.length > 0 ? rowFlags : undefined
    };
  }
}
