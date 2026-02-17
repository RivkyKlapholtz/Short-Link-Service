/**
 * Simulates fraud validation: 500ms delay, then 50% probability true/false.
 * Used to decide whether a click earns the $0.05 credit.
 */
const DELAY_MS = 500;

export interface IFraudValidationService {
  validate(): Promise<boolean>;
}

export class FraudValidationService implements IFraudValidationService {
  async validate(): Promise<boolean> {
    await new Promise((r) => setTimeout(r, DELAY_MS));
    return Math.random() < 0.5;
  }
}
