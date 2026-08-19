import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { relapse } from "../streaks/service.js";

registerMainMenuItem({ label: "↩️ Log relapse", data: "streak:relapse", order: 20 });
const composer = new Composer<Ctx>();

composer.callbackQuery("streak:relapse", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await relapse(ctx), {
    reply_markup: inlineKeyboard([[inlineButton("✅ Check streak", "streak:check"), inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
