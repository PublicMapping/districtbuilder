import { MigrationInterface, QueryRunner } from "typeorm";

export class EmailVerification1585433166931 implements MigrationInterface {
  name = "EmailVerification1585433166931";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "email_verification" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "emailToken" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "UQ_3ffc9210f041753e837b29d9e5b" UNIQUE ("email"), CONSTRAINT "PK_b985a8362d9dac51e3d6120d40e" PRIMARY KEY ("id"))`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "email_verification"`, undefined);
  }
}
