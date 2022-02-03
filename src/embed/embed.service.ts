import { MessageEmbed } from "discord.js";
import { URL } from "url";
import { Embedder, ParsedUrl } from "./embedders/base.embedder";

export class EmbedService {
  constructor(private readonly embedders: Embedder<any>[]) {}

  public async generateEmbeds(urls: URL[]) {
    let pairs: [ParsedUrl, Embedder<any>][] = [];

    for (const url of urls) {
      for (const embedder of this.embedders) {
        const parsedUrl = embedder.parse(url);
        if (parsedUrl) {
          pairs.push([parsedUrl, embedder]);
        }
      }
    }

    pairs = pairs.filter(
      ([url1], index) =>
        pairs.findIndex(([url2]) => url1.constructor === url2.constructor && url1.equals(url2)) === index,
    );

    const embeds = await Promise.all(pairs.map(([url, embedder]) => embedder.generate(url).catch(console.error)));

    return embeds.filter((embed): embed is MessageEmbed[] => !!embed);
  }
}
