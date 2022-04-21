import {
  Controller,
  InternalServerErrorException,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  Query
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import csvParse from "csv-parse";
import { Express } from "express";
import "multer";

import {
  ImportRowFlag,
  DistrictsImportApiResponse,
  DistrictImportField,
  RegionConfigId
} from "@districtbuilder/shared/entities";
import { FIPS, MAX_IMPORT_ERRORS } from "@districtbuilder/shared/constants";
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
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query("regionConfigId") regionConfigId?: RegionConfigId
  ): Promise<DistrictsImportApiResponse> {
    /* eslint-disable */
    const parser = csvParse(file.buffer, { fromLine: 2 });
    let records: [string, string][] = [];
    // Seemingly the simplest way of getting all the records into an array is to iterate in a for-loop :(
    for await (const record of parser) {
      records.push(record);
    }
    /* eslint-enable */

    // Array of flagged rows to be returned
    const flaggedRows: ImportRowFlag[] = [];

    function setFlag(
      row: readonly string[],
      rowNumber: number,
      field: DistrictImportField,
      errorText: string
    ) {
      const flag = { rowNumber: rowNumber, errorText: errorText, rowValue: row, field: field };
      // eslint-disable-next-line functional/immutable-data
      flaggedRows[rowNumber] = flag;
    }
    const stateFips: string = records[0][0]?.slice(0, 2);
    if (!(stateFips in FIPS)) {
      throw new InternalServerErrorException();
    }

    const regionCode = FIPS[stateFips];
    const regionConfig = await this.regionConfigService.findOne(
      regionConfigId
        ? { id: regionConfigId, archived: false }
        : {
            regionCode,
            hidden: false,
            archived: false
          }
    );
    const geoCollection = regionConfig && (await this.topologyService.get(regionConfig));
    if (!geoCollection) {
      throw new InternalServerErrorException();
    }

    const blockIdCounts: {
      [blockId: string]: number;
    } = {};

    // Iterate through records to flag invalid rows
    records.forEach((record, i) => {
      const rowFips = record[0]?.slice(0, 2);
      const blockId = record[0];
      // eslint-disable-next-line functional/immutable-data
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

    const unflaggedRows = records.filter((record, i) => !flaggedRows[i]);
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitProperties = (await geoCollection.getTopologyProperties())[baseGeoLevel];

    // Find unmatched records
    const allBlockIds: Set<unknown> = new Set(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      baseGeoUnitProperties.map((props: any) => props[baseGeoLevel])
    );
    const invalidRecords = records.filter((record, i) => {
      if (!allBlockIds.has(record[0]) && !flaggedRows[i]) {
        setFlag(record, i, "BLOCKID", "Invalid block ID");
        return true;
      }
      return false;
    });

    // This is a heuristic more than an exact detection method, but it seems sufficient from my testing
    if (invalidRecords.length > MAX_IMPORT_ERRORS) {
      return {
        error: `There were ${invalidRecords.length} invalid block IDs for ${regionCode}, ensure the CSV uploaded is for the Census year ${regionConfig?.census}`
      };
    }

    const blockToDistricts = Object.fromEntries(
      unflaggedRows.map(([block, district]) => [block, Number(district)])
    );
    const districtsDefinition = await geoCollection.importFromCSV(blockToDistricts);

    const maxDistrictId = Object.values(blockToDistricts).reduce((a, b) => Math.max(a, b), 0);
    const rowFlags = flaggedRows.filter(r => !!r);
    const numFlags = rowFlags.length;

    return {
      districtsDefinition,
      maxDistrictId,
      numFlags: numFlags || undefined,
      rowFlags: numFlags > 0 ? rowFlags.slice(0, MAX_IMPORT_ERRORS) : undefined
    };
  }
}
