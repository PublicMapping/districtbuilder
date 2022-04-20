import {MigrationInterface, QueryRunner} from "typeorm";

export class referenceLayersConstraint1632512688121 implements MigrationInterface {
    name = 'referenceLayersConstraint1632512688121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP CONSTRAINT "FK_e6141b3c1854a523a0755406ec4"`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ALTER COLUMN "project_id" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "reference_layer"."project_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD CONSTRAINT "CHK_4e77a0b7d0479ef3d32e7cc98d" CHECK ("project_id" IS NOT NULL OR "project_template_id" IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD CONSTRAINT "FK_e6141b3c1854a523a0755406ec4" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP CONSTRAINT "FK_e6141b3c1854a523a0755406ec4"`);
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP CONSTRAINT "CHK_4e77a0b7d0479ef3d32e7cc98d"`);
        await queryRunner.query(`COMMENT ON COLUMN "reference_layer"."project_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ALTER COLUMN "project_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD CONSTRAINT "FK_e6141b3c1854a523a0755406ec4" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
