import bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, OneToMany } from "typeorm";
import { IUser } from "../../../../shared/entities";
import { BCRYPT_SALT_ROUNDS } from "../../common/constants";
import { Organization } from "../../organizations/entities/organization.entity";
import { Project } from "../../projects/entities/project.entity";

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, type: "character varying" })
  email: string;

  @Column({ type: "character varying" })
  name: string;

  @Column({ default: false, type: "boolean" })
  isEmailVerified: boolean;

  @Column({ default: false, type: "boolean" })
  hasSeenTour: boolean;

  @ManyToMany(() => Organization, organization => organization.users)
  organizations: Organization[];

  @OneToMany(() => Project, project => project.user)
  projects: Project[];

  @OneToMany(() => Organization, organization => organization.admin)
  adminOrganizations: Organization[];

  // TODO: Is it possible to make this private? I only want to allow
  // modification via setPassword
  @Column({ type: "character varying" })
  @Exclude()
  passwordHash: string;

  @Column({
    type: "timestamp with time zone",
    name: "created_dt",
    default: () => "NOW()"
  })
  createdDt: Date;

  @Column({
    type: "timestamp with time zone",
    name: "last_login_dt",
    default: () => "NOW()"
  })
  lastLoginDt: Date;

  @Column({ default: false, type: "boolean" })
  isMarketingEmailOn: boolean;

  constructor(params?: {
    id?: string;
    email: string;
    name: string;
    passwordHash?: string;
    isMarketingEmailOn: boolean;
  }) {
    if (!params) {
      return;
    }
    this.email = params.email;
    this.name = params.name;
    if (params.id) {
      this.id = params.id;
    }
    if (params.passwordHash) {
      this.passwordHash = params.passwordHash;
    }
    this.isMarketingEmailOn = params.isMarketingEmailOn;
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  async setPassword(password: string): Promise<void> {
    // eslint-disable-next-line functional/immutable-data
    this.passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return;
  }

  passwordOutdated(): boolean {
    return bcrypt.getRounds(this.passwordHash) < BCRYPT_SALT_ROUNDS;
  }
}
