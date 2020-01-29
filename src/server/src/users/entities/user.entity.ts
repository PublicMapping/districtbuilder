import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../../../../shared/entities";
@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn()
  readonly id: string;
  @Column({ unique: true })
  readonly email: string;
}
