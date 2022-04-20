import { MigrationInterface, QueryRunner } from "typeorm";

export class projectVersion1628182840067 implements MigrationInterface {
  name = "projectVersion1628182840067";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "region_config_version" TIMESTAMP WITH TIME ZONE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "region_config_version"`);
  }
}
