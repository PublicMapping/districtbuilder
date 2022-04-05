import {MigrationInterface, QueryRunner} from "typeorm";

export class contestFields1648042252591 implements MigrationInterface {
    name = 'contestFields1648042252591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "submitted_dt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "project_template" ADD "contest_next_steps" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "project_template" ADD "contest_active" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_template" DROP COLUMN "contest_active"`);
        await queryRunner.query(`ALTER TABLE "project_template" DROP COLUMN "contest_next_steps"`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "submitted_dt"`);
    }

}
