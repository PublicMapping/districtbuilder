import {MigrationInterface, QueryRunner} from "typeorm";

export class addConfigurablePopulationDeviation1621459864489 implements MigrationInterface {
    name = 'addConfigurablePopulationDeviation1621459864489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "population_deviation" double precision NOT NULL DEFAULT 5`);
        await queryRunner.query(`ALTER TABLE "project_template" ADD "population_deviation" double precision NOT NULL DEFAULT 5`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_template" DROP COLUMN "population_deviation"`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "population_deviation"`);
    }

}
