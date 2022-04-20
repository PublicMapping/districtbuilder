import { MigrationInterface, QueryRunner } from "typeorm";

export class referenceLayerNotNullable1630617724474 implements MigrationInterface {
  name = "referenceLayerNotNullable1630617724474";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reference_layer" ALTER COLUMN "layer" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "reference_layer" ALTER COLUMN "label_field" SET DEFAULT ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reference_layer" ALTER COLUMN "layer" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "reference_layer" ALTER COLUMN "label_field" DROP DEFAULT`
    );
  }
}
