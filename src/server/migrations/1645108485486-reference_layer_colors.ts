import {MigrationInterface, QueryRunner} from "typeorm";

export class referenceLayerColors1645108485486 implements MigrationInterface {
    name = 'referenceLayerColors1645108485486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reference_layer_layer_color_enum" AS ENUM('#17c42f', '#f3ad37', '#7549f6', '#0018ff', '#eaa0bd', '#f62756')`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD "layer_color" "public"."reference_layer_layer_color_enum" NOT NULL DEFAULT '#17c42f'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP COLUMN "layer_color"`);
        await queryRunner.query(`DROP TYPE "public"."reference_layer_layer_color_enum"`);
    }

}
