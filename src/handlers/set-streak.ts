import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { setStreak } from "../streaks/service.js";

const composer = new Composer<Ctx>();
const usage = "Usage: /setstreak <non-negative integer>";

composer.command("setstreak", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const match = /^\/setstreak(?:@\w+)?\s+([0-9]+)\s*$/.exec(text);
  if (!match) {
    await ctx.reply(usage);
    return;
  }

  const length = Number(match[1]);
  if (!Number.isSafeInteger(length) || length < 0) {
    await ctx.reply(usage);
    return;
  }

  await ctx.reply(await setStreak(ctx, length));
});

export default composer;
