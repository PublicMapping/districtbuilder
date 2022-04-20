import {MigrationInterface, QueryRunner} from "typeorm";

export class referenceLayerColors1645802284098 implements MigrationInterface {
    name = 'referenceLayerColors1645802284098'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reference_layer_layer_color_enum" AS ENUM('GREEN', 'ORANGE', 'PURPLE', 'BLUE', 'PINK', 'RED')`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD "layer_color" "public"."reference_layer_layer_color_enum" NOT NULL DEFAULT 'GREEN'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP COLUMN "layer_color"`);
        await queryRunner.query(`DROP TYPE "public"."reference_layer_layer_color_enum"`);
    }

}
