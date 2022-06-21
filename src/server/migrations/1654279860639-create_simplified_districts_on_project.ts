import {MigrationInterface, QueryRunner} from "typeorm";

export class createSimplifiedDistrictsOnProject1654279860639 implements MigrationInterface {
    name = 'createSimplifiedDistrictsOnProject1654279860639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "simplified_districts" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "simplified_districts"`);
    }

}
