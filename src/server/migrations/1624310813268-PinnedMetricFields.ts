import {MigrationInterface, QueryRunner} from "typeorm";

export class PinnedMetricFields1624310813268 implements MigrationInterface {
    name = 'PinnedMetricFields1624310813268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "pinned_metric_fields" character varying array NOT NULL DEFAULT ARRAY['population','populationDeviation','raceChart','pvi','compactness']`);
        await queryRunner.query(`ALTER TABLE "project_template" ADD "pinned_metric_fields" character varying array NOT NULL DEFAULT ARRAY['population','populationDeviation','raceChart','pvi','compactness']`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_template" DROP COLUMN "pinned_metric_fields"`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "pinned_metric_fields"`);
    }

}
