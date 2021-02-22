import bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { IUser } from "../../../../shared/entities";
import { BCRYPT_SALT_ROUNDS } from "../../common/constants";
import { Organization } from "../../organizations/entities/organization.entity";
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

  @ManyToMany(
    type => Organization,
    organization => organization.users
  )
  organizations: Organization[];

  // TODO: Is it possible to make this private? I only want to allow
  // modification via setPassword
  @Column({ type: "character varying" })
  @Exclude()
  passwordHash: string;

  constructor(params?: { id?: string; email: string; name: string; passwordHash?: string }) {
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
