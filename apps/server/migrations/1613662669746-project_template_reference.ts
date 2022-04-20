import {MigrationInterface, QueryRunner} from "typeorm";

export class projectTemplateReference1613662669746 implements MigrationInterface {
    name = 'projectTemplateReference1613662669746'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "project_template_id" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_5bb9a0df7a43f52071785805ee9" FOREIGN KEY ("project_template_id") REFERENCES "project_template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_5bb9a0df7a43f52071785805ee9"`, undefined);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "project_template_id"`, undefined);
    }

}
