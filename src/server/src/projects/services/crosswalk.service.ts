import { Injectable, Logger } from "@nestjs/common";
import S3 from "aws-sdk/clients/s3";
import csvParse from "csv-parse";
import _ from "lodash";

import { RegionCode } from "../../../../shared/entities";
import { REGION_TO_FIPS } from "../../../../shared/constants";
import { getObject, s3Options } from "../../common/s3-wrapper";
import Crosswalk from "../entities/crosswalk.entity";

const CROSSWALK_S3_FOLDER = "s3://global-districtbuilder-data-us-east-1/crosswalk-files/";

@Injectable()
export class CrosswalkService {
  private readonly logger = new Logger(CrosswalkService.name);
  private readonly s3 = new S3();

  async getCrosswalk(regionCode: RegionCode): Promise<Crosswalk | undefined> {
    const stateFips = REGION_TO_FIPS[regionCode];
    const csvResponse = await getObject(
      this.s3,
      s3Options(CROSSWALK_S3_FOLDER, `block1020_crosswalk_${stateFips}.csv`)
    );

    if (csvResponse.Body === undefined) {
      this.logger.error("No crosswalk file found for ");
      return;
    }
    const parser = csvParse(csvResponse.Body?.toString("utf8"), { relaxColumnCount: true });
    const crosswalk: Crosswalk = {};
    // eslint-disable-next-line functional/no-loop-statement
    for await (const record of parser) {
      const items = record as readonly string[];
      const newFips = items[0];
      const blocks = _.chunk(items.slice(1), 2);
      // eslint-disable-next-line functional/immutable-data
      crosswalk[newFips] = blocks.map(([fips, amount]) => ({ fips, amount: Number(amount) }));
    }

    return crosswalk;
  }
}
