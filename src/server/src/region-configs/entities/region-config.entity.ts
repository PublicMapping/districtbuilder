import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique
} from "typeorm";
import { IRegionConfig } from "../../../../shared/entities";
import { Chamber } from "../../chambers/entities/chamber.entity";
import { ProjectTemplate } from "../../project-templates/entities/project-template.entity";
import { CensusDate } from "../../../../shared/constants";

@Entity()
@Unique(["name", "countryCode", "regionCode", "version"])
@Index("UQ_region_code", ["countryCode", "regionCode"], { unique: true, where: "hidden <> TRUE" })
export class RegionConfig implements IRegionConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @Column({ type: "character varying", name: "country_code" })
  countryCode: string;

  @Column({ type: "character varying", name: "region_code" })
  regionCode: string;

  @OneToMany(() => ProjectTemplate, projectTemplate => projectTemplate.regionConfig)
  projectTemplates: ProjectTemplate[];

  @OneToMany(() => Chamber, chamber => chamber.regionConfig)
  @JoinColumn({ name: "chamber_id" })
  chambers: readonly Chamber[];

  @Column({ type: "character varying", name: "s3_uri", unique: true })
  s3URI: string;

  @Column({ type: "timestamp with time zone", default: () => "NOW()" })
  version: Date;

  // Hidden regions have data loaded and can be used to edit projects,
  // but do not appear in the list of regions when creating a new project
  @Column({ type: "boolean", default: false })
  hidden: boolean;

  // Archived regions are hidden, and also do not have data loaded and so their projects cannot be edited
  @Column({ type: "boolean", default: false })
  archived: boolean;

  @Column({ type: "enum", enum: CensusDate, default: CensusDate.Census2020 })
  census: CensusDate;

  @Column({ name: "layer_size_in_bytes", type: "integer", default: 0 })
  layerSizeInBytes: number;
}
