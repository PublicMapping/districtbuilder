import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IChamber } from "../../../../shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";

@Entity()
export class Chamber implements IChamber {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @Column({ type: "integer", name: "number_of_districts" })
  numberOfDistricts: number;

  @ManyToOne(() => RegionConfig, { nullable: false })
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;
}
