import {MigrationInterface, QueryRunner} from "typeorm";

export class ProjectTemplate1613651828605 implements MigrationInterface {
    name = 'ProjectTemplate1613651828605'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "project_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "number_of_districts" integer NOT NULL, "districts_definition" jsonb, "description" character varying NOT NULL, "details" character varying NOT NULL, "organization_id" uuid NOT NULL, "region_config_id" uuid NOT NULL, "chamber_id" uuid, CONSTRAINT "PK_41cf7a5f5e816a0c36f494283b4" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "project_template" ADD CONSTRAINT "FK_25db54e5c3cdafc129442082960" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "project_template" ADD CONSTRAINT "FK_09c29a0babbc6f2602d4581ec17" FOREIGN KEY ("region_config_id") REFERENCES "region_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "project_template" ADD CONSTRAINT "FK_cb419f246098b1f2594371c89d8" FOREIGN KEY ("chamber_id") REFERENCES "chamber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project_template" DROP CONSTRAINT "FK_cb419f246098b1f2594371c89d8"`, undefined);
        await queryRunner.query(`ALTER TABLE "project_template" DROP CONSTRAINT "FK_09c29a0babbc6f2602d4581ec17"`, undefined);
        await queryRunner.query(`ALTER TABLE "project_template" DROP CONSTRAINT "FK_25db54e5c3cdafc129442082960"`, undefined);
        await queryRunner.query(`DROP TABLE "project_template"`, undefined);
    }

}
