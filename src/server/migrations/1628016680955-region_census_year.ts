import {MigrationInterface, QueryRunner} from "typeorm";

export class regionCensusYear1628016680955 implements MigrationInterface {
    name = 'regionCensusYear1628016680955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."region_config_census_enum" AS ENUM('2010', '2020')`);
        await queryRunner.query(`ALTER TABLE "public"."region_config" ADD "census" "public"."region_config_census_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."region_config" DROP COLUMN "census"`);
        await queryRunner.query(`DROP TYPE "public"."region_config_census_enum"`);
    }

}
