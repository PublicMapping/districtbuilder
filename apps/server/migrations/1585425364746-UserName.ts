import { MigrationInterface, QueryRunner } from "typeorm";

export class UserName1585425364746 implements MigrationInterface {
  name = "UserName1585425364746";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" ADD "name" character varying NOT NULL`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`, undefined);
  }
}
