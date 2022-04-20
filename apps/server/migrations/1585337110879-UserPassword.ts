import {MigrationInterface, QueryRunner} from "typeorm";

export class UserPassword1585337110879 implements MigrationInterface {
    name = 'UserPassword1585337110879'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD "passwordHash" character varying NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passwordHash"`, undefined);
    }

}
