import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsMarketingEmailOnToUser1651868826475 implements MigrationInterface {
    name = 'AddIsMarketingEmailOnToUser1651868826475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isMarketingEmailOn" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isMarketingEmailOn"`);
    }

}
