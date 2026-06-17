import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing');
}

export const bot = new Bot(token);

const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'; // Must be HTTPS

// Setup commands
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    '🚀 Open StudyArena',
    webAppUrl
  );

  await ctx.reply(
    `Welcome to StudyArena! 🎓\n\nI am your virtual mentor and assistant. I will notify you about your new homework, vocabulary, and daily quests.\n\nClick the button below to start learning!`,
    {
      reply_markup: keyboard,
    }
  );
});

// Optionally log errors
bot.catch((err) => {
  console.error(`Bot Error for ${err.ctx.update.update_id}:`, err.error);
});
