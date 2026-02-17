import { randomBytes } from "crypto";

const LENGTH = 6;
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShortCode(): string {
  const bytes = randomBytes(LENGTH);
  let result = "";
  for (let i = 0; i < LENGTH; i++) {
    result += CHARS[bytes[i]! % CHARS.length];
  }
  return result;
}
