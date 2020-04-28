import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateChambers1588095954534 implements MigrationInterface {
    name = 'CreateChambers1588095954534'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "chamber" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "number_of_districts" integer NOT NULL, "region_config_id" uuid NOT NULL, CONSTRAINT "PK_cde4a9652dfc250c6184b3f6fb4" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "number_of_districts"`, undefined);
        await queryRunner.query(`ALTER TABLE "chamber" ADD CONSTRAINT "FK_bd9a72ee2440495d77bc84d4c16" FOREIGN KEY ("region_config_id") REFERENCES "region_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "chamber" DROP CONSTRAINT "FK_bd9a72ee2440495d77bc84d4c16"`, undefined);
        await queryRunner.query(`ALTER TABLE "project" ADD "number_of_districts" integer NOT NULL`, undefined);
        await queryRunner.query(`DROP TABLE "chamber"`, undefined);
    }

}
