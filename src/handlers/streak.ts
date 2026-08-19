import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { checkStreak } from "../streaks/service.js";

registerMainMenuItem({ label: "✅ Check streak", data: "streak:check", order: 10 });

const composer = new Composer<Ctx>();

const actions = inlineKeyboard([
  [inlineButton("📊 Stats", "streak:stats"), inlineButton("🏆 Leaderboard", "streak:leaderboard")],
  [inlineButton("⚙️ Visibility", "streak:visibility"), inlineButton("⬅️ Back to menu", "menu:main")],
]);

composer.command("streak", async (ctx) => {
  await ctx.reply(await checkStreak(ctx), { reply_markup: actions });
});

export default composer;
