import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { IRegionConfig } from "../../../../shared/entities";

@Entity()
@Unique(["name", "countryCode", "regionCode", "version"])
export class RegionConfig implements IRegionConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ name: "country_code" })
  countryCode: string;

  @Column({ name: "region_code" })
  regionCode: string;

  @Column({ name: "s3_uri", unique: true })
  s3URI: string;

  @Column({ type: "timestamp with time zone", default: () => "NOW()" })
  version: Date;
}
