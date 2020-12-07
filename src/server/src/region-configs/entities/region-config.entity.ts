import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { IRegionConfig } from "../../../../shared/entities";
import { Chamber } from "../../chambers/entities/chamber.entity";

@Entity()
@Unique(["name", "countryCode", "regionCode", "version"])
export class RegionConfig implements IRegionConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @Column({ type: "character varying", name: "country_code" })
  countryCode: string;

  @Column({ type: "character varying", name: "region_code" })
  regionCode: string;

  @OneToMany(
    () => Chamber,
    chamber => chamber.regionConfig
  )
  @JoinColumn({ name: "chamber_id" })
  chambers: readonly Chamber[];

  @Column({ type: "character varying", name: "s3_uri", unique: true })
  s3URI: string;

  @Column({ type: "timestamp with time zone", default: () => "NOW()" })
  version: Date;

  @Column({ type: "boolean", default: false })
  hidden: boolean;
}
