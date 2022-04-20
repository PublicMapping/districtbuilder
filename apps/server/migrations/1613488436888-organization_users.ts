import {MigrationInterface, QueryRunner} from "typeorm";

export class organizationUsers1613488436888 implements MigrationInterface {
    name = 'organizationUsers1613488436888'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "organization_users_user" ("organizationId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_a0057ab2ced35777f00eaaa9673" PRIMARY KEY ("organizationId", "userId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e1e28e472b43bbad7ff3cecdcd" ON "organization_users_user" ("organizationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a02d820429038dce37d18f74b6" ON "organization_users_user" ("userId") `, undefined);
        await queryRunner.query(`ALTER TABLE "organization_users_user" ADD CONSTRAINT "FK_e1e28e472b43bbad7ff3cecdcdd" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "organization_users_user" ADD CONSTRAINT "FK_a02d820429038dce37d18f74b68" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "organization_users_user" DROP CONSTRAINT "FK_a02d820429038dce37d18f74b68"`, undefined);
        await queryRunner.query(`ALTER TABLE "organization_users_user" DROP CONSTRAINT "FK_e1e28e472b43bbad7ff3cecdcdd"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_a02d820429038dce37d18f74b6"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e1e28e472b43bbad7ff3cecdcd"`, undefined);
        await queryRunner.query(`DROP TABLE "organization_users_user"`, undefined);
    }

}
