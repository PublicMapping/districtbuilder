import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectAdvancedEditFlag1598899242836 implements MigrationInterface {
  name = "ProjectAdvancedEditFlag1598899242836";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "advancedEditingEnabled" boolean NOT NULL DEFAULT false`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "advancedEditingEnabled"`,
      undefined
    );
  }
}
