import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { IOrganization } from "../../../../shared/entities";

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
}
