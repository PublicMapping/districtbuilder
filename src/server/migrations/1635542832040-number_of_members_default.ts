import {MigrationInterface, QueryRunner} from "typeorm";

export class numberOfMembersDefault1635542832040 implements MigrationInterface {
    name = 'numberOfMembersDefault1635542832040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "project" SET "number_of_members" =  ARRAY_FILL(1, ARRAY["number_of_districts"], ARRAY[1]);`);
        await queryRunner.query(`UPDATE "project_template" SET "number_of_members" =  ARRAY_FILL(1, ARRAY["number_of_districts"], ARRAY[1]);`);

        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "number_of_members" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "project"."number_of_members" IS NULL`);
        await queryRunner.query(`ALTER TABLE "project_template" ALTER COLUMN "number_of_members" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "project_template"."number_of_members" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "project_template"."number_of_members" IS NULL`);
        await queryRunner.query(`ALTER TABLE "project_template" ALTER COLUMN "number_of_members" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "project"."number_of_members" IS NULL`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "number_of_members" DROP NOT NULL`);
    }

}
