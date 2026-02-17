import type { IGreetingRepository, Greeting } from "../repositories/index.js";

export interface IGreetingService {
  add(name: string, message?: string): Promise<Greeting>;
  list(): Promise<Greeting[]>;
}

export class GreetingService implements IGreetingService {
  constructor(private readonly greetingRepository: IGreetingRepository) {}

  async add(name: string, message?: string): Promise<Greeting> {
    return this.greetingRepository.insert(name, message);
  }

  async list(): Promise<Greeting[]> {
    return this.greetingRepository.findAll();
  }
}
