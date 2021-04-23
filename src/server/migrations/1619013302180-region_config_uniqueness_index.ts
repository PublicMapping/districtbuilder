import {MigrationInterface, QueryRunner} from "typeorm";

export class regionConfigUniquenessIndex1619013302180 implements MigrationInterface {
    name = 'regionConfigUniquenessIndex1619013302180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_region_code" ON "region_config" ("country_code", "region_code") WHERE hidden <> TRUE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_region_code"`);
    }

}
