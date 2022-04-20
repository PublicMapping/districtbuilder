import { MigrationInterface, QueryRunner } from "typeorm";

export class addPostgis1635458920929 implements MigrationInterface {
  name = "addPostgis1635458920929";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "postgis"`);
  }
}
