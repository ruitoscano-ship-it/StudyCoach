import { describe, expect, it } from "vitest";
import { addDays, parseWeekStartParam, startOfWeekMonday, toYmd } from "@/lib/dates";

describe("dates helpers", () => {
  it("computes monday start for any week day", () => {
    const monday = startOfWeekMonday(new Date("2026-05-06T10:00:00Z"));
    expect(toYmd(monday)).toBe("2026-05-04");
  });

  it("adds days without mutating original date", () => {
    const src = new Date("2026-05-05T00:00:00Z");
    const next = addDays(src, 2);
    expect(toYmd(src)).toBe("2026-05-05");
    expect(toYmd(next)).toBe("2026-05-07");
  });

  it("falls back to current week when week param is invalid", () => {
    const parsed = parseWeekStartParam("not-a-date");
    expect(parsed.getDay()).toBe(1);
  });
});
