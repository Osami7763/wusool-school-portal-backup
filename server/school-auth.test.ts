import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./school-auth";

describe("school local authentication", () => {
  it("hashes and verifies the correct password without storing plain text", () => {
    const hash = hashPassword("1");
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toBe("1");
    expect(verifyPassword("1", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("uses a different salt for repeated hashes", () => {
    expect(hashPassword("school-password")).not.toBe(hashPassword("school-password"));
  });
});
