import { MigrationInterface, QueryRunner } from "typeorm";

export class regionConfigHidden1605289114325 implements MigrationInterface {
  name = "regionConfigHidden1605289114325";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "region_config" ADD "hidden" boolean NOT NULL DEFAULT false`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "region_config" DROP COLUMN "hidden"`, undefined);
  }
}
