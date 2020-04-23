import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateProject1587647155543 implements MigrationInterface {
    name = 'CreateProject1587647155543'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "number_of_districts" integer NOT NULL, "created_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "region_config_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_377d1fdbf2cd8ba262840788001" FOREIGN KEY ("region_config_id") REFERENCES "region_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_1cf56b10b23971cfd07e4fc6126" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_1cf56b10b23971cfd07e4fc6126"`, undefined);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_377d1fdbf2cd8ba262840788001"`, undefined);
        await queryRunner.query(`DROP TABLE "project"`, undefined);
    }

}
