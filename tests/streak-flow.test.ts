import { afterEach, describe, expect, it } from "vitest";
import { setClockForTests } from "../src/streaks/clock";
import { checkStreak, relapse } from "../src/streaks/service";
import { getUser } from "../src/streaks/store";

const DAY = 24 * 60 * 60 * 1000;
const ctx = {
  from: { id: 99001, first_name: "Clock tester" },
} as never;

afterEach(() => setClockForTests(undefined));

describe("streak timing and relapse", () => {
  it("increments when the last check-in is exactly 24 hours old", async () => {
    setClockForTests(() => 0);
    await checkStreak(ctx);
    setClockForTests(() => DAY);

    await expect(checkStreak(ctx)).resolves.toContain("2-day streak");
  });

  it("resets a relapse while retaining the best streak", async () => {
    setClockForTests(() => DAY);
    await relapse(ctx);

    const user = await getUser(ctx, 99001);
    expect(user?.currentStreakLength).toBe(0);
    expect(user?.highestStreakEver).toBe(2);
  });
});
