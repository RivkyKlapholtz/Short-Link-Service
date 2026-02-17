import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";

@Entity("Links")
export class Link {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "nvarchar", length: 2048 })
  targetUrl!: string;

  @Column({ type: "nvarchar", length: 32, unique: true })
  shortCode!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany("Click", "link")
  clicks!: unknown[];
}
