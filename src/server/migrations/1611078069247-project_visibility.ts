import { MigrationInterface, QueryRunner } from "typeorm";

export class projectVisibility1611078069247 implements MigrationInterface {
  name = "projectVisibility1611078069247";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "project_visibility_enum" AS ENUM('PRIVATE', 'VISIBLE', 'PUBLISHED')`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "visibility" "project_visibility_enum" NOT NULL DEFAULT 'VISIBLE'`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "visibility"`, undefined);
    await queryRunner.query(`DROP TYPE "project_visibility_enum"`, undefined);
  }
}
