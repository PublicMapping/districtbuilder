import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: string;
  @Column({ unique: true })
  readonly email: string;
}
