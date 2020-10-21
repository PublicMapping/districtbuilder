import { MigrationInterface, QueryRunner } from "typeorm";

export class LockedDistricts1603292225812 implements MigrationInterface {
  name = "LockedDistricts1603292225812";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "locked_districts" boolean array NOT NULL DEFAULT '{}'`,
      undefined
    );
    await queryRunner.query(
      `UPDATE "project" SET "locked_districts" = array_fill(FALSE, ARRAY["number_of_districts"])`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "locked_districts"`, undefined);
  }
}
