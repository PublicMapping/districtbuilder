import {MigrationInterface, QueryRunner} from "typeorm";

export class regionConfigLayerSize1649083635651 implements MigrationInterface {
    name = 'regionConfigLayerSize1649083635651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "region_config" ADD "layer_size_in_bytes" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "region_config" DROP COLUMN "layer_size_in_bytes"`);
    }

}
