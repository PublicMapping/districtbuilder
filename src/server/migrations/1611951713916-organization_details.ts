import {MigrationInterface, QueryRunner} from "typeorm";

export class organizationDetails1611951713916 implements MigrationInterface {
    name = 'organizationDetails1611951713916'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" ADD "description" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD "logoUrl" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD "linkUrl" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD "municipality" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" ADD "region" character varying NOT NULL DEFAULT ''`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "region"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "municipality"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "linkUrl"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "logoUrl"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "description"`, undefined);
    }

}
