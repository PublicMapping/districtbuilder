import { FeatureCollection, MultiPolygon } from "geojson";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { ProjectVisibility } from "../../../../shared/constants";
import {
  DistrictProperties,
  DistrictsDefinition,
  IProject,
  MetricField,
  GeoUnitHierarchy
} from "../../../../shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { Chamber } from "../../chambers/entities/chamber.entity";
import { User } from "../../users/entities/user.entity";
import { ProjectTemplate } from "../../project-templates/entities/project-template.entity";
import {
  DEFAULT_POPULATION_DEVIATION,
  DEFAULT_PINNED_METRIC_FIELDS
} from "../../../../shared/constants";
import { GeoUnitTopology } from "../../districts/entities/geo-unit-topology.entity";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { GeoUnitProperties } from "../../districts/entities/geo-unit-properties.entity";

// TODO #179: Move to shared/entities
export type DistrictsGeoJSON = FeatureCollection<MultiPolygon, DistrictProperties>;

const LOGGER = new Logger("Project");

@Entity()
export class Project implements IProject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @ManyToOne(() => RegionConfig, { nullable: false })
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;

  // The version of Project.regionConfig at the time of last update,
  // used to bust cache for districts column
  @Column({ type: "timestamp with time zone", name: "region_config_version" })
  regionConfigVersion: Date;

  @ManyToOne(() => Chamber, { nullable: true })
  @JoinColumn({ name: "chamber_id" })
  chamber?: Chamber;

  @ManyToOne(() => ProjectTemplate, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "project_template_id" })
  projectTemplate?: ProjectTemplate;

  @Column({ name: "number_of_districts", type: "integer" })
  numberOfDistricts: number;

  @Column({
    type: "jsonb",
    name: "districts_definition",
    nullable: true
  })
  districtsDefinition: DistrictsDefinition;

  @Column({
    type: "jsonb",
    name: "districts",
    nullable: true
  })
  districts?: DistrictsGeoJSON;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "timestamp with time zone", name: "created_dt", default: () => "NOW()" })
  createdDt: Date;

  @Column({
    type: "timestamp with time zone",
    name: "updated_dt",
    default: () => "NOW()"
  })
  updatedDt: Date;

  @Column({ type: "boolean", default: false, name: "advanced_editing_enabled" })
  advancedEditingEnabled: boolean;

  @Column({
    type: "boolean",
    name: "locked_districts",
    array: true,
    default: () => "'{}'"
  })
  lockedDistricts: readonly boolean[];

  @Column({ type: "enum", enum: ProjectVisibility, default: ProjectVisibility.Published })
  visibility: ProjectVisibility;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @Column({ type: "boolean", default: false, name: "is_featured" })
  isFeatured: boolean;

  @Column({
    type: "double precision",
    name: "population_deviation",
    default: DEFAULT_POPULATION_DEVIATION
  })
  populationDeviation: number;

  @Column({
    type: "character varying",
    array: true,
    name: "pinned_metric_fields",
    default: () => `ARRAY[${DEFAULT_PINNED_METRIC_FIELDS.map(c => `'${c}'`).join(",")}]`
  })
  pinnedMetricFields: MetricField[];

  // Strips out data that we don't want to have available in the read-only view in the UI
  getReadOnlyView(): Project {
    return { ...this, lockedDistricts: new Array(this.numberOfDistricts).fill(false) };
  }

  exportToCsv(geoCollection: GeoUnitTopology | GeoUnitProperties): [string, number][] {
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitProperties = geoCollection.topologyProperties[baseGeoLevel];

    // First column is the base geounit id, second column is the district id
    const mutableCsvRows: [string, number][] = [];

    // The geounit hierarchy and district definition have the same structure (except the
    // hierarchy always goes out to the base geounit level). Walk them both at the same time
    // and collect the information needed for the CSV (base geounit id and district id).
    const accumulateCsvRows = (
      defnSubset: number | GeoUnitHierarchy,
      hierarchySubset: GeoUnitHierarchy
    ) => {
      hierarchySubset.forEach((hierarchyNumOrArray, idx) => {
        const districtOrArray = typeof defnSubset === "number" ? defnSubset : defnSubset[idx];
        if (typeof districtOrArray === "number" && typeof hierarchyNumOrArray === "number") {
          // The numbers found in the hierarchy are the base geounit indices of the topology.
          // Access this item in the topology to find it's base geounit id.
          const props: any = baseGeoUnitProperties[hierarchyNumOrArray];
          mutableCsvRows.push([props[baseGeoLevel], districtOrArray]);
        } else if (typeof hierarchyNumOrArray !== "number") {
          // Keep recursing into the hierarchy until we reach the end
          accumulateCsvRows(districtOrArray, hierarchyNumOrArray);
        } else {
          // This shouldn't ever happen, and would suggest a district definition/hierarchy mismatch
          LOGGER.error(
            "Hierarchy and districts definition mismatch",
            districtOrArray.toString(),
            hierarchyNumOrArray.toString()
          );
          throw new InternalServerErrorException();
        }
      });
    };
    accumulateCsvRows(this.districtsDefinition, geoCollection.hierarchyDefinition);

    return mutableCsvRows;
  }
}
