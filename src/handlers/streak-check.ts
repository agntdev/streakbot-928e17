import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { checkStreak } from "../streaks/service.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("streak:check", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await checkStreak(ctx), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
