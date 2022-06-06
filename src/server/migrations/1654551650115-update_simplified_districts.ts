import {MigrationInterface, QueryRunner} from "typeorm";

export class updateSimplifiedDistricts1654551650115 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `UPDATE project SET simplified_districts = CASE
            WHEN districts IS NULL THEN NULL
            ELSE JSON_BUILD_OBJECT(
                'type', 'FeatureCollection',
                'features', ARRAY(
                SELECT JSON_BUILD_OBJECT(
                    'type', 'Feature',
                    'properties', feature->'properties',
                    'geometry', ST_AsGeoJSON(ST_Simplify(ST_GeomFromGeoJSON(feature->'geometry'), 0.001))::json
                )
                FROM jsonb_array_elements(districts->'features') feature
                )
            )
            END`,
          undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE project SET simplified_districts = '{}'`, undefined);
    }

}
