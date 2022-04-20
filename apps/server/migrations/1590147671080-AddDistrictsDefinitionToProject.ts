import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDistrictsDefinitionToProject1590147671080 implements MigrationInterface {
    name = 'AddDistrictsDefinitionToProject1590147671080'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "districts_definition" jsonb`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "districts_definition"`, undefined);
    }

}
