import {MigrationInterface, QueryRunner} from "typeorm";

export class projectDistricts1614028839986 implements MigrationInterface {
    name = 'projectDistricts1614028839986'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "districts" jsonb`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "districts"`, undefined);
    }

}
