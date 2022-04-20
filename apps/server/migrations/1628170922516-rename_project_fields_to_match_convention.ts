import {MigrationInterface, QueryRunner} from "typeorm";

export class renameProjectFieldsToMatchConvention1628170922516 implements MigrationInterface {
    name = 'renameProjectFieldsToMatchConvention1628170922516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" RENAME COLUMN "advancedEditingEnabled" TO "advanced_editing_enabled"`);
        await queryRunner.query(`ALTER TABLE "project" RENAME COLUMN "isFeatured" TO "is_featured"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" RENAME COLUMN "advanced_editing_enabled" TO "advancedEditingEnabled"`);
        await queryRunner.query(`ALTER TABLE "project" RENAME COLUMN "is_featured" TO "isFeatured"`);
    }

}
