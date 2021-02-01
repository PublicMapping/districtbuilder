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

  @Column({ default: "" })
  description: string;

  @Column({ default: "" })
  logoUrl: string;

  @Column({ default: "" })
  linkUrl: string;

  @Column({ default: "" })
  municipality: string;

  @Column({ default: "" })
  region: string;
}
