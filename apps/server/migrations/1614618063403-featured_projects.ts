import {MigrationInterface, QueryRunner} from "typeorm";

export class featuredProjects1614618063403 implements MigrationInterface {
    name = 'featuredProjects1614618063403'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" ADD "isFeatured" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "isFeatured"`, undefined);
    }

}
