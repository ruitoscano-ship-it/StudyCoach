import { describe, expect, it } from "vitest";
import { readAppEnv } from "@/lib/env";

describe("env contract integration", () => {
  it("accepts a valid deployment env contract", () => {
    const env = readAppEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/study_coach",
      AUTH_SECRET: "01234567890123456789",
    });

    expect(env.NODE_ENV).toBe("production");
  });
});
