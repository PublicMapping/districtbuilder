import {MigrationInterface, QueryRunner} from "typeorm";

export class updateTypeorm1639841546639 implements MigrationInterface {
    name = 'updateTypeorm1639841546639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_users_user" DROP CONSTRAINT "FK_e1e28e472b43bbad7ff3cecdcdd"`);
        await queryRunner.query(`ALTER TABLE "organization_users_user" DROP CONSTRAINT "FK_a02d820429038dce37d18f74b68"`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "pinned_metric_fields" SET DEFAULT '{population,populationDeviation,raceChart,pvi,compactness}'`);
        await queryRunner.query(`ALTER TABLE "project_template" ALTER COLUMN "pinned_metric_fields" SET DEFAULT '{population,populationDeviation,raceChart,pvi,compactness}'`);
        await queryRunner.query(`ALTER TABLE "organization_users_user" ADD CONSTRAINT "FK_e1e28e472b43bbad7ff3cecdcdd" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "organization_users_user" ADD CONSTRAINT "FK_a02d820429038dce37d18f74b68" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_users_user" DROP CONSTRAINT "FK_a02d820429038dce37d18f74b68"`);
        await queryRunner.query(`ALTER TABLE "organization_users_user" DROP CONSTRAINT "FK_e1e28e472b43bbad7ff3cecdcdd"`);
        await queryRunner.query(`ALTER TABLE "project_template" ALTER COLUMN "pinned_metric_fields" SET DEFAULT ARRAY['population', 'populationDeviation', 'raceChart', 'pvi', 'compactness']`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "pinned_metric_fields" SET DEFAULT ARRAY['population', 'populationDeviation', 'raceChart', 'pvi', 'compactness']`);
        await queryRunner.query(`ALTER TABLE "organization_users_user" ADD CONSTRAINT "FK_a02d820429038dce37d18f74b68" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_users_user" ADD CONSTRAINT "FK_e1e28e472b43bbad7ff3cecdcdd" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
