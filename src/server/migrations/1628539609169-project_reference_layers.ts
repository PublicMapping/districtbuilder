import {MigrationInterface, QueryRunner} from "typeorm";

export class projectReferenceLayers1628539609169 implements MigrationInterface {
    name = 'projectReferenceLayers1628539609169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "reference_layer_layer_type_enum" AS ENUM('POLYGON', 'POINT')`);
        await queryRunner.query(`CREATE TABLE "reference_layer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "layer_type" "reference_layer_layer_type_enum" NOT NULL DEFAULT 'POINT', "label_field" character varying NOT NULL, "layer" jsonb, "project_id" uuid NOT NULL, CONSTRAINT "PK_10f7a8d2caeaa45f75400d6f3bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reference_layer" ADD CONSTRAINT "FK_e6141b3c1854a523a0755406ec4" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reference_layer" DROP CONSTRAINT "FK_e6141b3c1854a523a0755406ec4"`);
        await queryRunner.query(`DROP TABLE "reference_layer"`);
        await queryRunner.query(`DROP TYPE "reference_layer_layer_type_enum"`);
    }

}
