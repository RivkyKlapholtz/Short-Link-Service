import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";

const EARNINGS_PER_VALID_CLICK = 0.05;

@Entity("Clicks")
export class Click {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("int")
  linkId!: number;

  @ManyToOne("Link", "clicks", { onDelete: "CASCADE" })
  @JoinColumn({ name: "linkId" })
  link!: unknown;

  @CreateDateColumn()
  createdAt!: Date;

  /** 0 or EARNINGS_PER_VALID_CLICK (0.05) when fraud validation passed */
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  earnings!: number;
}

export { EARNINGS_PER_VALID_CLICK };
