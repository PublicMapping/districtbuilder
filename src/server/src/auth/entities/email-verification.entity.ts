import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: string;
  @Column({ unique: true })
  email: string;
  @Column()
  emailToken: string;
  @Column()
  timestamp: Date;
}
