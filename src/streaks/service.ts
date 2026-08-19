import type { Ctx } from "../bot.js";
import { now } from "./clock.js";
import { allUsers, getUser, putUser, type UserStreak } from "./store.js";

const DAY = 24 * 60 * 60 * 1000;
type StreakCtx = Ctx & { env?: unknown };

function displayName(ctx: Ctx): string {
  const name = ctx.from?.username ?? ctx.from?.first_name ?? "A streak friend";
  return name.replace(/[<>]/g, "").slice(0, 64) || "A streak friend";
}

async function profile(ctx: StreakCtx): Promise<UserStreak | undefined> {
  if (!ctx.from) return undefined;
  return getUser(ctx, ctx.from.id);
}

function fresh(ctx: Ctx, at: number): UserStreak {
  return {
    telegramId: ctx.from!.id,
    displayName: displayName(ctx),
    timezone: "UTC",
    joinDate: at,
    isVisible: true,
    currentStreakLength: 1,
    streakStartTimestamp: at,
    lastCheckInTimestamp: at,
    highestStreakEver: 1,
  };
}

export async function checkStreak(ctx: StreakCtx): Promise<string> {
  if (!ctx.from) return "I couldn't identify your account. Try again in a private chat.";
  const at = now();
  let user = await profile(ctx);
  if (!user || user.currentStreakLength === 0 || user.lastCheckInTimestamp === null) {
    user = fresh(ctx, at);
    await putUser(ctx, user);
    return "Your new streak starts today: 1 day. Check in again after 24 hours.";
  }
  const elapsed = at - user.lastCheckInTimestamp;
  if (elapsed >= DAY) {
    const increments = Math.floor(elapsed / DAY);
    user.currentStreakLength += increments;
    user.lastCheckInTimestamp += increments * DAY;
    user.highestStreakEver = Math.max(user.highestStreakEver, user.currentStreakLength);
    user.displayName = displayName(ctx);
    await putUser(ctx, user);
    return `Nice work — you're on a ${user.currentStreakLength}-day streak. Check in again after 24 hours.`;
  }
  const remaining = DAY - elapsed;
  return `You're on a ${user.currentStreakLength}-day streak. Your next day unlocks in ${duration(remaining)}.`;
}

export async function relapse(ctx: StreakCtx): Promise<string> {
  if (!ctx.from) return "I couldn't identify your account. Try again in a private chat.";
  const user = await profile(ctx);
  if (!user || user.currentStreakLength === 0) return "You don't have an active streak yet — tap Check streak to begin one.";
  user.highestStreakEver = Math.max(user.highestStreakEver, user.currentStreakLength);
  user.currentStreakLength = 0;
  user.streakStartTimestamp = null;
  user.lastCheckInTimestamp = null;
  await putUser(ctx, user);
  return `That streak is closed. Your best is ${user.highestStreakEver} day${user.highestStreakEver === 1 ? "" : "s"}. Tap Check streak when you're ready to start again.`;
}

export async function stats(ctx: StreakCtx): Promise<string> {
  if (!ctx.from) return "I couldn't identify your account. Try again in a private chat.";
  const user = await profile(ctx);
  if (!user) return "No streak yet — tap Check streak to start your first day.";
  const rank = await userRank(ctx, user.telegramId);
  const joined = new Date(user.joinDate).toISOString().slice(0, 10);
  return `Your streak: ${user.currentStreakLength} day${user.currentStreakLength === 1 ? "" : "s"}\nBest streak: ${user.highestStreakEver} day${user.highestStreakEver === 1 ? "" : "s"}\nJoined: ${joined}\nRank: ${rank ?? "not on the public board"}`;
}

export async function board(ctx: StreakCtx): Promise<string> {
  const ranked = rankUsers((await allUsers(ctx)).filter((user) => user.isVisible && user.currentStreakLength > 0));
  if (ranked.length === 0) return "No public streaks yet — tap Check streak to be the first.";
  const top = ranked.slice(0, 10);
  const lines = ["Community streaks", ...top.map((user, i) => `${i + 1}. ${user.displayName} — ${user.currentStreakLength} days (best ${user.highestStreakEver})`)];
  if (ctx.from) {
    const position = ranked.findIndex((user) => user.telegramId === ctx.from!.id);
    if (position >= 10) lines.push(`Your rank: ${position + 1}`);
  }
  return lines.join("\n");
}

export async function setVisibility(ctx: StreakCtx, visible: boolean): Promise<string> {
  if (!ctx.from) return "I couldn't identify your account. Try again in a private chat.";
  let user = await profile(ctx);
  if (!user) {
    const at = now();
    user = { ...fresh(ctx, at), currentStreakLength: 0, highestStreakEver: 0, streakStartTimestamp: null, lastCheckInTimestamp: null };
  }
  user.isVisible = visible;
  user.displayName = displayName(ctx);
  await putUser(ctx, user);
  return visible ? "You're back on the public leaderboard." : "You're hidden from the public leaderboard.";
}

function rankUsers(users: UserStreak[]): UserStreak[] {
  return users.sort((a, b) => b.currentStreakLength - a.currentStreakLength || b.highestStreakEver - a.highestStreakEver || a.joinDate - b.joinDate);
}

async function userRank(ctx: StreakCtx, id: number): Promise<number | undefined> {
  const at = rankUsers((await allUsers(ctx)).filter((user) => user.isVisible && user.currentStreakLength > 0)).findIndex((user) => user.telegramId === id);
  return at === -1 ? undefined : at + 1;
}

function duration(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
