import { MigrationInterface, QueryRunner } from "typeorm";

export class projectIndex1629680461750 implements MigrationInterface {
  name = "projectIndex1629680461750";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_110113f7f5d7d3b08d0c12f5b0" ON "project" ("updated_dt", "user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PUBLISHED_PROJECTS" ON "project" ("updated_dt" DESC, jsonb_array_length(project.districts->'features'->0->'geometry'->'coordinates'), "region_config_id") WHERE "archived" <> TRUE AND "visibility" = 'PUBLISHED'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_110113f7f5d7d3b08d0c12f5b0"`);
    await queryRunner.query(`DROP INDEX "IDX_PUBLISHED_PROJECTS"`);
  }
}
