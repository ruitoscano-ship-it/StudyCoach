import { compare } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/password";

describe("password hashing security baseline", () => {
  it("stores non-plaintext hashes and validates with bcrypt", async () => {
    const plain = "StrongPassword#123";
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    await expect(compare(plain, hashed)).resolves.toBe(true);
  });
});
