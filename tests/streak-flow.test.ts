import { afterEach, describe, expect, it } from "vitest";
import { setClockForTests } from "../src/streaks/clock";
import { board, checkStreak, relapse, setStreak } from "../src/streaks/service";
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

  it("sets zero by clearing active timestamps while retaining the best streak", async () => {
    setClockForTests(() => DAY * 2);
    await setStreak(ctx, 5);
    await setStreak(ctx, 0);

    const user = await getUser(ctx, 99001);
    expect(user?.currentStreakLength).toBe(0);
    expect(user?.highestStreakEver).toBe(5);
    expect(user?.streakStartTimestamp).toBeNull();
    expect(user?.lastCheckInTimestamp).toBeNull();
    expect(user?.auditLog.at(-1)).toMatchObject({ source: "setstreak", newCurrentStreak: 0, newHighestStreak: 5 });
  });

  it("sets a positive streak from its calculated start time", async () => {
    const at = DAY * 10;
    setClockForTests(() => at);
    await setStreak(ctx, 3);

    const user = await getUser(ctx, 99001);
    expect(user?.currentStreakLength).toBe(3);
    expect(user?.highestStreakEver).toBe(5);
    expect(user?.streakStartTimestamp).toBe(at - DAY * 2);
    expect(user?.lastCheckInTimestamp).toBe(at);
    await expect(board(ctx)).resolves.toContain("Clock tester — 3 days (best 5)");
  });
});
