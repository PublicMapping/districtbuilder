import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";

import { IOrganization } from "../../../../shared/entities";
import { User } from "../../users/entities/user.entity";

@Entity()
export class Organization implements IOrganization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying", unique: true })
  slug: string;

  @Column({ type: "character varying" })
  name: string;

  @Column({ type: "character varying", default: "" })
  description: string;

  @Column({ type: "character varying", default: "" })
  logoUrl: string;

  @Column({ type: "character varying", default: "" })
  linkUrl: string;

  @Column({ type: "character varying", default: "" })
  municipality: string;

  @Column({ type: "character varying", default: "" })
  region: string;

  @ManyToMany(
    () => User,
    user => user.organizations,
    {
      eager: true
    }
  )
  @JoinTable()
  users: User[];
}
