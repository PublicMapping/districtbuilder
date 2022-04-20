import {MigrationInterface, QueryRunner} from "typeorm";

export class userCreationAndLoginDates1646168889613 implements MigrationInterface {
    name = 'userCreationAndLoginDates1646168889613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "created_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "user" ADD "last_login_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_login_dt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "created_dt"`);
    }

}
