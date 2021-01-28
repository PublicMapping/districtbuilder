import bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { IOrganization } from "../../../../shared/entities";

@Entity()
export class Organization implements IOrganization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;
}
