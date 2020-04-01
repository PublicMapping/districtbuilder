import bcrypt from "bcrypt";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../../../../shared/entities";
import { BCRYPT_SALT_ROUNDS } from "../../constants";

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  // TODO: Is it possible to make this private? I only want to allow
  // modification via setPassword
  // Note: not in shared interface and not intended to be sent over-the-wire
  @Column()
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
    this.passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return;
  }

  passwordOutdated(): boolean {
    return bcrypt.getRounds(this.passwordHash) < BCRYPT_SALT_ROUNDS;
  }
}
