import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { DistrictsDefinition, IProjectTemplateWithProjects } from "../../../../shared/entities";
import { Chamber } from "../../chambers/entities/chamber.entity";
import { Organization } from "../../organizations/entities/organization.entity";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { Project } from "../../projects/entities/project.entity";

@Entity()
export class ProjectTemplate implements IProjectTemplateWithProjects {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @Column({ type: "character varying" })
  name: string;

  @ManyToOne(
    () => RegionConfig,
    regionConfig => regionConfig.projectTemplates,
    { nullable: false }
  )
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;

  @ManyToOne(() => Chamber, { nullable: true })
  @JoinColumn({ name: "chamber_id" })
  chamber?: Chamber;

  @OneToMany(
    type => Project,
    project => project.projectTemplate
  )
  projects: Project[];

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

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;
}
