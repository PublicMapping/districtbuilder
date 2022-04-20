import { MigrationInterface, QueryRunner } from "typeorm";

export class regionCensusYear1628016841545 implements MigrationInterface {
  name = "regionCensusYear1628016841545";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is the list of 2020 states that have been processed as-of writing this migration
    await queryRunner.query(`
        UPDATE region_config SET census = CASE WHEN s3_uri = ANY('{
        s3://global-districtbuilder-dev-us-east-1/regions/US/AK/2021-06-18T14:24:11.337Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/AZ/2021-07-01T15:29:22.217Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/CO/2021-06-30T16:20:02.781Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/DC/2021-06-12T00:25:53.517Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/DE/2021-06-11T23:03:36.938Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/GA/2021-06-30T17:12:22.649Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/HI/2021-06-18T15:51:03.204Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/IA/2021-06-12T14:45:27.207Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/ID/2021-06-12T14:48:46.371Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/IL/2021-06-04T15:05:37.089Z,
s3://global-districtbuilder-dev-us-east-1/regions/US/KS/2021-06-12T14:50:54.971Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/LA/2021-06-12T14:53:58.291Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/ME/2021-06-30T17:27:46.642Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/MI/2021-06-21T20:10:55.297Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/MN/2021-06-12T14:56:57.316Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/MT/2021-06-18T21:11:45.923Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/NV/2021-06-30T18:34:44.920Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/NH/2021-06-12T15:01:01.278Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/NC/2021-06-30T18:13:40.821Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/OH/2021-06-12T15:02:06.107Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/OK/2021-06-12T15:06:56.221Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/RI/2021-06-12T15:10:22.621Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/SC/2021-06-12T15:11:15.083Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/UT/2021-06-30T18:55:51.375Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/VT/2021-06-29T20:38:26.744Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/WI/2021-06-18T17:42:56.629Z/,
s3://global-districtbuilder-dev-us-east-1/regions/US/WY/2021-06-17T20:44:48.259Z/}'::text[])
        THEN '2020'::region_config_census_enum ELSE '2010'::region_config_census_enum END
        `);
    await queryRunner.query(
      `ALTER TABLE "public"."region_config" ALTER COLUMN "census" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."region_config" ALTER COLUMN "census" SET DEFAULT '2020'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."region_config" ALTER COLUMN "census" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."region_config" ALTER COLUMN "census" DROP NOT NULL`
    );
  }
}
