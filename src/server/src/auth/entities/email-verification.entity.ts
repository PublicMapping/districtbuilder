import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

export enum VerificationType {
  FORGOT_PASSWORD = "forgot password",
  INITIAL = "initial"
}

@Entity()
@Unique(["email", "type"])
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: string;
  @Column()
  email: string;
  @Column()
  emailToken: string;
  @Column()
  timestamp: Date;
  @Column({
    type: "enum",
    enum: VerificationType
  })
  type: VerificationType;
}
