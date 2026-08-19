import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { stats } from "../streaks/service.js";

const composer = new Composer<Ctx>();

composer.command("stats", async (ctx) => {
  await ctx.reply(await stats(ctx), { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) });
});

export default composer;
