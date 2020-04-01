import { MigrationInterface, QueryRunner } from "typeorm";

export class UserVerifiedFlag1585680945045 implements MigrationInterface {
  name = "UserVerifiedFlag1585680945045";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isEmailVerified"`, undefined);
  }
}
