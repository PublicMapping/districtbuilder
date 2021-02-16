import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { DistrictsDefinition, IProjectTemplate } from "../../../../shared/entities";
import { Chamber } from "../../chambers/entities/chamber.entity";
import { Organization } from "../../organizations/entities/organization.entity";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";

@Entity()
export class ProjectTemplate implements IProjectTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @Column({ type: "character varying" })
  name: string;

  @ManyToOne(() => RegionConfig, { nullable: false })
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;

  @ManyToOne(() => Chamber, { nullable: true })
  @JoinColumn({ name: "chamber_id" })
  chamber: Chamber;

  @Column({ name: "number_of_districts", type: "integer" })
  numberOfDistricts: number;

  @Column({
    type: "jsonb",
    name: "districts_definition",
    nullable: true
  })
  districtsDefinition: DistrictsDefinition;

  @Column({ type: "character varying" })
  description: string;

  @Column({ type: "character varying" })
  details: string;
}
