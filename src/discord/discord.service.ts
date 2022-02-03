import Discord from "discord.js";
import { EmbedService } from "src/embed/embed.service";
import { URL } from "url";
import { chunkArray } from "../util";

export class DiscordService {
  constructor(private readonly client: Discord.Client, private readonly embedService: EmbedService) {
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("messageCreate", this.onMessageCreate.bind(this));
  }

  private matchUrls(input: string) {
    return (input.match(/https?:\/\/[^\s<]+[^<.,:;"'\]\s]/g) ?? []).map((url) => new URL(url));
  }

  private async onReady() {
    console.log("ready");
  }

  private async onMessageCreate(message: Discord.Message) {
    if (message.author.id === this.client.user?.id) return;

    const urls = this.matchUrls(message.content);

    if (urls.length < 1) return;

    const embeds = await this.embedService.generateEmbeds(urls);

    if (embeds.length < 1) return;

    const removeEmbeds = message.edit({ flags: Discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS });

    let chunks: Discord.MessageEmbed[][] = [];

    for (const embed of embeds) {
      if (embed.length > 1) {
        chunks = chunks.concat(chunkArray(embed, 10));
      } else {
        if (chunks.length < 1 || chunks[chunks.length - 1].length >= 10) {
          chunks.push([]);
        }

        chunks[chunks.length - 1].push(Array.isArray(embed) ? embed[0] : embed);
      }
    }

    for (const chunk of chunks) {
      await message.channel.send({
        reply: {
          messageReference: message,
        },
        embeds: chunk,
      });
    }

    await removeEmbeds;
  }

  public async login(token: string) {
    return this.client.login(token);
  }
}
