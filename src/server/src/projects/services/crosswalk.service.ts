import { Injectable, Logger } from "@nestjs/common";
import S3, { GetObjectRequest } from "aws-sdk/clients/s3";
import csvParse from "csv-parse";
import _ from "lodash";

import Crosswalk from "../entities/crosswalk.entity";
import { S3URI, RegionCode } from "../../../../shared/entities";
import { REGION_TO_FIPS } from "../../../../shared/constants";

const CROSSWALK_S3_FOLDER = "s3://global-districtbuilder-data-us-east-1/crosswalk-files/";

function s3Options(path: S3URI, fileName: string): GetObjectRequest {
  const url = new URL(path);
  const pathWithoutLeadingSlash = url.pathname.substring(1);
  const options = { Bucket: url.hostname, Key: `${pathWithoutLeadingSlash}${fileName}` };
  return options;
}

@Injectable()
export class CrosswalkService {
  private readonly logger = new Logger(CrosswalkService.name);
  private readonly s3 = new S3();

  constructor() {}

  async getCrosswalk(regionCode: RegionCode): Promise<Crosswalk | undefined> {
    const stateFips = REGION_TO_FIPS[regionCode];
    const csvResponse = await this.s3
      .getObject(s3Options(CROSSWALK_S3_FOLDER, `block1020_crosswalk_${stateFips}.csv`))
      .promise();

    if (csvResponse.Body === undefined) {
      this.logger.error("No crosswalk file found for ");
      return;
    }
    const parser = csvParse(csvResponse.Body?.toString("utf8"), { relaxColumnCount: true });
    let crosswalk: Crosswalk = {};
    for await (const record of parser) {
      const items = record as readonly string[];
      const newFips = items[0];
      const blocks = _.chunk(items.slice(1), 2);
      crosswalk[newFips] = blocks.map(([fips, amount]) => ({ fips, amount: Number(amount) }));
    }

    return crosswalk;
  }
}
