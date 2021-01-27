import { MigrationInterface, QueryRunner } from "typeorm";

export class projectVisibilityDefault1611080485499 implements MigrationInterface {
  name = "projectVisibilityDefault1611080485499";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "visibility" SET DEFAULT 'VISIBLE'`,
      undefined
    );
  }
}
