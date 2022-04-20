import {MigrationInterface, QueryRunner} from "typeorm";

export class projectVersionDefault1628546956803 implements MigrationInterface {
    name = 'projectVersionDefault1628546956803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE project SET region_config_version = region_config.version FROM region_config WHERE project.region_config_id = region_config.id`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "region_config_version" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "region_config_version" DROP NOT NULL`);
    }

}
