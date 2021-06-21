import {MigrationInterface, QueryRunner} from "typeorm";

export class regionConfigArchivedFlag1624298721363 implements MigrationInterface {
    name = 'regionConfigArchivedFlag1624298721363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "region_config" ADD "archived" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "region_config" DROP COLUMN "archived"`);
    }

}
