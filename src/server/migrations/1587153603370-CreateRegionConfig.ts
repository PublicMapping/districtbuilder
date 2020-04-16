import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateRegionConfig1587153603370 implements MigrationInterface {
    name = 'CreateRegionConfig1587153603370'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "region_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "country_code" character varying NOT NULL, "region_code" character varying NOT NULL, "s3_uri" character varying NOT NULL, "version" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_07cc7193176f7610686f2730492" UNIQUE ("s3_uri"), CONSTRAINT "UQ_d2ee646fdd8506be3d136711909" UNIQUE ("name", "country_code", "region_code", "version"), CONSTRAINT "PK_2cc33eabc641c2fc526f2bb20ea" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "region_config" DROP CONSTRAINT "UQ_d2ee646fdd8506be3d136711909"`, undefined);
        await queryRunner.query(`ALTER TABLE "region_config" ADD CONSTRAINT "UQ_d2ee646fdd8506be3d136711909" UNIQUE ("name", "country_code", "region_code", "version")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "region_config" DROP CONSTRAINT "UQ_d2ee646fdd8506be3d136711909"`, undefined);
        await queryRunner.query(`ALTER TABLE "region_config" ADD CONSTRAINT "UQ_d2ee646fdd8506be3d136711909" UNIQUE ("name", "country_code", "region_code", "version")`, undefined);
        await queryRunner.query(`DROP TABLE "region_config"`, undefined);
    }

}
