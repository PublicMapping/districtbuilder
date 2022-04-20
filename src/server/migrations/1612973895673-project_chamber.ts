import {MigrationInterface, QueryRunner} from "typeorm";

export class projectChamber1612973895673 implements MigrationInterface {
    name = 'projectChamber1612973895673'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "chamber_id" uuid`, undefined);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_75d1f8b659b714de8aa529a5fc6" FOREIGN KEY ("chamber_id") REFERENCES "chamber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_75d1f8b659b714de8aa529a5fc6"`, undefined);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "chamber_id"`, undefined);
    }

}
