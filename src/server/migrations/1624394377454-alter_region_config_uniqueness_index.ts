import { MigrationInterface, QueryRunner } from "typeorm";

export class alterRegionConfigUniquenessIndex1624394377454 implements MigrationInterface {
  name = "alterRegionConfigUniquenessIndex1624394377454";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_region_code"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_region_code" ON "region_config" ("country_code", "region_code") WHERE hidden <> TRUE AND archived <> TRUE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_region_code"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_region_code" ON "region_config" ("country_code", "region_code") WHERE hidden <> TRUE`
    );
  }
}
