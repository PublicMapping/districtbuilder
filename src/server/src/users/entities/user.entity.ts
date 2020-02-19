import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../../../../shared/entities";

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;
}
