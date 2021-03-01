import { Column, Entity, JoinTable, JoinColumn, OneToMany, PrimaryGeneratedColumn, ManyToMany, ManyToOne } from "typeorm";


import { IOrganization } from "../../../../shared/entities";
import { User } from "../../users/entities/user.entity";
import { ProjectTemplate } from "../../project-templates/entities/project-template.entity";

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

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  admin: User;

  @OneToMany(
    () => ProjectTemplate,
    template => template.organization
  )
  projectTemplates: ProjectTemplate[];
}
