import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { stats } from "../streaks/service.js";

registerMainMenuItem({ label: "📊 My stats", data: "streak:stats", order: 30 });
const composer = new Composer<Ctx>();

composer.callbackQuery("streak:stats", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await stats(ctx), { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) });
});

export default composer;
