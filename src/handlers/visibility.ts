import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { setVisibility } from "../streaks/service.js";

registerMainMenuItem({ label: "⚙️ Visibility", data: "streak:visibility", order: 50 });

const composer = new Composer<Ctx>();
const controls = inlineKeyboard([
  [inlineButton("Hide me", "streak:hide"), inlineButton("Show me", "streak:show")],
  [inlineButton("⬅️ Back to menu", "menu:main")],
]);

composer.callbackQuery("streak:visibility", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Choose whether your display name appears on the public leaderboard.", { reply_markup: controls });
});

composer.command("hide", async (ctx) => {
  await ctx.reply(await setVisibility(ctx, false), { reply_markup: controls });
});

composer.command("show", async (ctx) => {
  await ctx.reply(await setVisibility(ctx, true), { reply_markup: controls });
});

composer.callbackQuery("streak:hide", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await setVisibility(ctx, false), { reply_markup: controls });
});

composer.callbackQuery("streak:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await setVisibility(ctx, true), { reply_markup: controls });
});

export default composer;
