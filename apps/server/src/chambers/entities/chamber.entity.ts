import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IChamber } from "@districtbuilder/shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";

@Entity()
export class Chamber implements IChamber {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @Column({ type: "integer", name: "number_of_districts" })
  numberOfDistricts: number;

  @Column({
    type: "integer",
    name: "number_of_members",
    array: true,
    nullable: true
  })
  numberOfMembers?: readonly number[];

  @ManyToOne(() => RegionConfig, { nullable: false })
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;
}
