import { MigrationInterface, QueryRunner } from "typeorm";

export class updateLockedDistricts1606339829204 implements MigrationInterface {
  name = "updateLockedDistricts1606339829204";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE project SET locked_districts = array_fill(FALSE, ARRAY[number_of_districts])`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`UPDATE project SET locked_districts = '{}'`, undefined);
  }
}
