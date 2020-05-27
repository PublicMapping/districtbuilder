import { MigrationInterface, QueryRunner } from "typeorm";

export class ForgotPasswordTypes1590169690909 implements MigrationInterface {
  name = "ForgotPasswordTypes1590169690909";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "email_verification_type_enum" AS ENUM('forgot password', 'initial')`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" ADD "type" "email_verification_type_enum" NOT NULL`,
      undefined
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" DROP CONSTRAINT "UQ_3ffc9210f041753e837b29d9e5b"`,
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
      `ALTER TABLE "email_verification" ADD CONSTRAINT "UQ_3ffc9210f041753e837b29d9e5b" UNIQUE ("email")`,
      undefined
    );
    await queryRunner.query(`ALTER TABLE "email_verification" DROP COLUMN "type"`, undefined);
    await queryRunner.query(`DROP TYPE "email_verification_type_enum"`, undefined);
  }
}
