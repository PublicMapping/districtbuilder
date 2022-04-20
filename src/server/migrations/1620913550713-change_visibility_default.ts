import {MigrationInterface, QueryRunner} from "typeorm";

export class changeVisibilityDefault1620913550713 implements MigrationInterface {
    name = 'changeVisibilityDefault1620913550713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "project"."visibility" IS NULL`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "visibility" SET DEFAULT 'PUBLISHED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`);
        await queryRunner.query(`COMMENT ON COLUMN "project"."visibility" IS NULL`);
    }

}
