import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { board } from "../streaks/service.js";

registerMainMenuItem({ label: "🏆 Leaderboard", data: "streak:leaderboard", order: 40 });
const composer = new Composer<Ctx>();

const keyboard = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("leaderboard", async (ctx) => {
  await ctx.reply(await board(ctx), { reply_markup: keyboard });
});

composer.callbackQuery("streak:leaderboard", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await board(ctx), { reply_markup: keyboard });
});

export default composer;
