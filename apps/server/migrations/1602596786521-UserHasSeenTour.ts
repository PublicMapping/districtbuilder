import {MigrationInterface, QueryRunner} from "typeorm";

export class UserHasSeenTour1602596786521 implements MigrationInterface {
    name = 'UserHasSeenTour1602596786521'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD "hasSeenTour" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hasSeenTour"`, undefined);
    }

}
