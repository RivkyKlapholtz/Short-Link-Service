import type { Repository } from "typeorm";
import type { Greeting } from "../entities/Greeting.js";

export type { Greeting };

export interface IGreetingRepository {
  insert(name: string, message?: string): Promise<Greeting>;
  findAll(): Promise<Greeting[]>;
}

export class GreetingRepository implements IGreetingRepository {
  constructor(private readonly repo: Repository<Greeting>) {}

  async insert(name: string, message = "Hello World"): Promise<Greeting> {
    const greeting = this.repo.create({ name, message });
    return this.repo.save(greeting);
  }

  async findAll(): Promise<Greeting[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }
}
