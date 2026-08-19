import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { relapse } from "../streaks/service.js";

const composer = new Composer<Ctx>();

composer.command("relapse", async (ctx) => {
  await ctx.reply(await relapse(ctx), {
    reply_markup: inlineKeyboard([[inlineButton("✅ Check streak", "streak:check"), inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
