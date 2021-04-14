import {MigrationInterface, QueryRunner} from "typeorm";

export class projectTemplateIsActive1615822466092 implements MigrationInterface {
    name = 'projectTemplateIsActive1615822466092'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project_template" ADD "is_active" boolean NOT NULL DEFAULT true`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project_template" DROP COLUMN "is_active"`, undefined);
    }

}
