import {MigrationInterface, QueryRunner} from "typeorm";

export class archiveProject1608566772477 implements MigrationInterface {
    name = 'archiveProject1608566772477'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "archived" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "archived"`, undefined);
    }

}
