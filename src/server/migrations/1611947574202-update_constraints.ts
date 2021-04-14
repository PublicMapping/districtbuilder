import { MigrationInterface, QueryRunner } from "typeorm";

export class updateConstraints1611947574202 implements MigrationInterface {
  name = "updateConstraints1611947574202";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "email_verification" DROP CONSTRAINT "UQ_40aa9efaef98ed03b98dfcd87f1"`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" ALTER COLUMN "type" DROP DEFAULT`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "locked_districts" SET DEFAULT '{}'::boolean[]`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" ADD CONSTRAINT "UQ_40aa9efaef98ed03b98dfcd87f1" UNIQUE ("email", "type")`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "email_verification" DROP CONSTRAINT "UQ_40aa9efaef98ed03b98dfcd87f1"`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "visibility" SET DEFAULT 'VISIBLE'`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "locked_districts" SET DEFAULT '{}'`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" ALTER COLUMN "type" SET DEFAULT 'initial'`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" ADD CONSTRAINT "UQ_40aa9efaef98ed03b98dfcd87f1" UNIQUE ("email", "type")`,
      undefined
    );
  }
}
