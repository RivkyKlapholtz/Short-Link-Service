import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("Greetings")
export class Greeting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: 500, default: "Hello World" })
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
