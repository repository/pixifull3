import Discord from "discord.js";
import dotenv from "dotenv";
import { DiscordService } from "./discord/discord.service";
import { EmbedService } from "./embed/embed.service";
import { PixivIllustEmedder } from "./embed/embedders/pixiv/pixiv-illust.embedder";

export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];

async function main() {
  dotenv.config();

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error("DISCORD_TOKEN is not defined");
  }

  const discordService = new DiscordService(
    new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] }),
    new EmbedService([new PixivIllustEmedder()]),
  );

  await discordService.login(token);
}
main();
