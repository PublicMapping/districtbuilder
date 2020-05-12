import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDistrictsDefinitionToProject1589294498103 implements MigrationInterface {
    name = 'AddDistrictsDefinitionToProject1589294498103'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "districts_definition" bytea NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "districts_definition"`, undefined);
    }

}
