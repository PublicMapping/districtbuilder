import {MigrationInterface, QueryRunner} from "typeorm";

export class referenceLayersTemplateColumn1632492690026 implements MigrationInterface {
    name = 'referenceLayersTemplateColumn1632492690026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD "project_template_id" uuid`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD CONSTRAINT "FK_53e790b817e1ef2709b41c128d9" FOREIGN KEY ("project_template_id") REFERENCES "project_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP CONSTRAINT "FK_53e790b817e1ef2709b41c128d9"`);
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP COLUMN "project_template_id"`);
    }

}
