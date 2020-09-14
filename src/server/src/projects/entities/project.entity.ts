import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { DistrictsDefinition, IProject } from "../../../../shared/entities";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { User } from "../../users/entities/user.entity";

@Entity()
export class Project implements IProject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => RegionConfig, { nullable: false })
  @JoinColumn({ name: "region_config_id" })
  regionConfig: RegionConfig;

  @Column({ name: "number_of_districts" })
  numberOfDistricts: number;

  @Column({
    type: "jsonb",
    name: "districts_definition",
    nullable: true
  })
  districtsDefinition: DistrictsDefinition;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "timestamp with time zone", name: "created_dt", default: () => "NOW()" })
  createdDt: Date;

  @Column({ default: false })
  advancedEditingEnabled: boolean;
}
