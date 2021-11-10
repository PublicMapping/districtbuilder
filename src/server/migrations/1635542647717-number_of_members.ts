import {MigrationInterface, QueryRunner} from "typeorm";

export class numberOfMembers1635542647717 implements MigrationInterface {
    name = 'numberOfMembers1635542647717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "number_of_members" integer array DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "project_template" ADD "number_of_members" integer array DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_template" DROP COLUMN "number_of_members"`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "number_of_members"`);
    }

}
