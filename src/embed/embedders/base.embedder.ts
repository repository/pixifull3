import Discord from "discord.js";
import { URL } from "url";

export abstract class ParsedUrl {
  abstract equals(other: ParsedUrl): boolean;
}

export abstract class Embedder<T> {
  public abstract parse(url: URL): T | undefined;
  public abstract generate: (url: T) => Promise<Discord.MessageEmbed[]>;
}
