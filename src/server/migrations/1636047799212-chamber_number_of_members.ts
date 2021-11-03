import {MigrationInterface, QueryRunner} from "typeorm";

export class chamberNumberOfMembers1636047799212 implements MigrationInterface {
    name = 'chamberNumberOfMembers1636047799212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chamber" ADD "number_of_members" integer array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chamber" DROP COLUMN "number_of_members"`);
    }

}
