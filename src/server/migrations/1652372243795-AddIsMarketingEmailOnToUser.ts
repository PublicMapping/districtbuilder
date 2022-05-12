import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsMarketingEmailOnToUser1652372243795 implements MigrationInterface {
    name = 'AddIsMarketingEmailOnToUser1652372243795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "is_marketing_email_on" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_marketing_email_on"`);
    }

}
