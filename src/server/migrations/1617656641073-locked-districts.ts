import {MigrationInterface, QueryRunner} from "typeorm";
'use strict';

export class lockedDistricts1617656641073 implements MigrationInterface {
    name = 'lockedDistricts1617656641073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE project SET locked_districts = locked_districts[2:] || false;`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE project SET locked_districts = false || locked_districts[:cardinality(locked_districts) - 1];`, undefined);
    }

}
