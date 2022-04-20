import { MigrationInterface, QueryRunner } from "typeorm";

export class addLastUpdatedToProjects1607960574923 implements MigrationInterface {
  name = "addLastUpdatedToProjects1607960574923";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "updated_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "updated_dt"`);
  }
}
