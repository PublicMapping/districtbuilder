import {MigrationInterface, QueryRunner} from "typeorm";

export class planscoreUrl1645539689420 implements MigrationInterface {
    name = 'planscoreUrl1645539689420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "planscore_url" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "planscore_url"`);
    }

}
