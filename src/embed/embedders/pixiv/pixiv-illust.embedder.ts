import cheerio, { Cheerio, Node } from "cheerio";
import Discord, { EmbedFieldData } from "discord.js";
import he from "he";
import mdtruncate from "markdown-truncate";
import fetch from "node-fetch";
import { URL } from "url";
import { PixivIllust, PixivIllustPages } from "../../../interfaces/pixiv-illust";
import { Embedder, ParsedUrl } from "../base.embedder";

export type Range = [number, number];
export type PageTuple = [PixivIllustPages.Page, number];

export class PixivIllustUrl extends ParsedUrl {
  constructor(public readonly id: number, public readonly range: Range[] = [[1, 1]]) {
    super();
    if (range.length < 1) {
      this.range = [[1, 1]];
    }
  }

  public equals(other: PixivIllustUrl): boolean {
    return this.id === other.id;
  }
}

export class PixivIllustEmedder implements Embedder<PixivIllustUrl> {
  private PIXIV_AJAX_ENDPONT = "https://www.pixiv.net/ajax/illust/";
  private PIXIV_ARTWORK_ENDPOINT = "https://www.pixiv.net/artworks/";
  private PIXIV_USER_ENDPOINT = "https://www.pixiv.net/users/";
  private PIXIV_PROXY_ENDPONT = "https://pixifull.xcvr48.workers.dev/";
  private PIXIV_COLOR = 0x0096fa;

  private parseRange(input: string) {
    return input
      .split(",")
      .map((r) => r.match(/^(\d+)?(-)?(\d+)?$/))
      .filter((m): m is RegExpMatchArray => !!(m?.[1] || m?.[3]))
      .map(
        ([, start, dash, end]): Range => [
          parseInt(start || "1", 10),
          parseInt(end || (dash ? Number.MAX_SAFE_INTEGER.toString() : start), 10),
        ],
      )
      .map((r) => r.sort((a, b) => a - b))
      .sort(([a], [b]) => a - b)
      .reduce<Range[]>(
        (a, c) =>
          !a.length || a[a.length - 1][1] < c[0]
            ? [...a, c]
            : [...a.slice(0, a.length - 1), [a[a.length - 1][0], Math.max(a[a.length - 1][1], c[0])]],
        [],
      );
  }

  private isInRange(page: number, range: Range[]) {
    return range.some(([start, end]) => start <= page && page <= end);
  }

  private sumRange(range: Range[]) {
    return range.reduce((a, [start, end]) => a + (end - start + 1), 0);
  }

  private convertIllustToPage(illust: PixivIllust.Body): PixivIllustPages.Page {
    return {
      width: illust.width,
      height: illust.height,
      urls: {
        original: illust.urls.original,
        regular: illust.urls.regular,
        small: illust.urls.small,
        thumb_mini: illust.urls.thumb,
      },
    };
  }

  private getPagesInRange(range: Range[], pages: PixivIllustPages.Page[]): PageTuple[] {
    const tuples = pages.map((page, i): PageTuple => [page, i + 1]);
    return range.reduce<PageTuple[]>((a, [start, end]) => a.concat(tuples.slice(start - 1, end)), []);
  }

  private formatDescription(input: string) {
    const $ = cheerio.load(input);

    const clean = (el: Cheerio<Node>) => {
      for (const child of el.contents()) {
        if (child.type === "text") {
          let text = he.decode($.html(child));

          if (/^https?:\/\/[^\s<]+[^<.,:;"'\]\s]$/.test(text)) continue;

          text = he.encode(Discord.Util.escapeMarkdown(text));

          $(child).replaceWith(text);
        } else {
          clean($(child));
        }
      }
    };

    clean($.root());
    $("br").map((_, e) => $(e).replaceWith("\n"));
    $("a").map((_, e) => {
      let link = $(e).attr("href");

      if (link?.startsWith("/jump.php?")) {
        link = decodeURIComponent(link.slice(10));
      }

      $(e).replaceWith(`[${$(e).text()}](${link})`);
    });
    $("strong").map((_, e) => $(e).replaceWith(`**${$(e).text()}**`));
    $("*").map((_, e) => $(e).replaceWith($(e).text()));

    return mdtruncate(he.decode($.html()), {
      limit: 350,
      ellipsis: true,
    });
  }

  private getProxiedUrl(url: string) {
    return new URL(new URL(url).pathname, this.PIXIV_PROXY_ENDPONT).toString();
  }

  private async findSuitableImage(urls: PixivIllust.Urls | PixivIllustPages.Urls) {
    const priority: (keyof typeof urls)[] = ["original", "regular"];

    for (const quality of priority) {
      const url = urls[quality];

      const response = await fetch(url, {
        method: "HEAD",
        headers: { Referer: "http://www.pixiv.net/" },
      });

      if (!response.ok) {
        throw new Error(`size check failed: ${response.status} ${url}`);
      }

      const length = parseInt(response.headers.get("content-length") || "", 10);

      if (!isFinite(length)) {
        throw new Error(`size check failed: could not determine content length ${url}`);
      }

      if (length > 10 * 1024 * 1024) {
        continue;
      }

      return quality;
    }

    return "small";
  }

  public parse(url: URL) {
    if (!/^(?:www\.)?pixiv\.net$/i.test(url.hostname)) return;

    let id: string | null | undefined;

    if (url.pathname === "/member_illust.php") {
      id = url.searchParams.get("illust_id");
      if (!(id && /^\d+$/.test(id))) return;
    } else {
      id = url.pathname.match(/^\/(?:en\/)?artworks\/(\d+)$/i)?.[1];
    }

    if (!id) return;

    let ranges = this.parseRange(url.hash.slice(1));

    return new PixivIllustUrl(parseInt(id, 10), ranges);
  }

  public async generate(url: PixivIllustUrl) {
    const illustUrl = this.PIXIV_AJAX_ENDPONT + url.id;
    const illustResponse = await fetch(illustUrl);

    if (!illustResponse.ok) {
      throw new Error(`failed to get illust info: ${illustResponse.status} ${illustUrl}`);
    }

    const { body: data } = (await illustResponse.json()) as PixivIllust.Response;

    if (data.xRestrict) {
      throw new Error(`r-18: ${url.id}`);
    }

    let userImage: string | undefined = undefined;

    for (const key in data.userIllusts) {
      const userIllust = data.userIllusts[key];
      if (userIllust?.profileImageUrl) {
        userImage = this.getProxiedUrl(userIllust.profileImageUrl);
        break;
      }
    }

    let pages: PageTuple[];

    if (data.pageCount === 1 || (this.isInRange(1, url.range) && this.sumRange(url.range) === 1)) {
      pages = [[this.convertIllustToPage(data), 1]];
    } else {
      const pagesUrl = illustUrl + "/pages";
      const pagesResponse = await fetch(pagesUrl);

      if (!pagesResponse.ok) {
        throw new Error(`failed to get illust pages: ${pagesResponse.status} ${pagesUrl}`);
      }

      const { body: allPages } = (await pagesResponse.json()) as PixivIllustPages.Response;

      pages = this.getPagesInRange(url.range, allPages);

      if (pages.length < 1) {
        pages = [[this.convertIllustToPage(data), 1]];
      }
    }

    const promises: Promise<Discord.MessageEmbedOptions>[] = [];

    for (const [page, pageNumber] of pages) {
      promises.push(
        (async () => {
          const quality = await this.findSuitableImage(page.urls);
          const qualityNotice: EmbedFieldData = {
            name: "Image Quality",
            value: `Using ${quality} due to size, [click here for original](${this.getProxiedUrl(data.urls.original)})`,
          };

          return {
            color: this.PIXIV_COLOR,
            image: { url: this.getProxiedUrl(page.urls[quality]) },
            fields: quality === "original" ? [] : [qualityNotice],
            footer: {
              text: `${pageNumber}/${data.pageCount}`,
            },
          };
        })(),
      );
    }

    const [first, ...rest] = await Promise.all(promises);

    const embeds = [
      {
        ...first,
        title: data.title,
        url: this.PIXIV_ARTWORK_ENDPOINT + url.id,
        description: this.formatDescription(data.description),
        timestamp: new Date(data.createDate),
        fields: [
          { name: "Views", value: data.viewCount.toLocaleString(), inline: true },
          { name: "Bookmarks", value: data.bookmarkCount.toLocaleString(), inline: true },
          { name: "Likes", value: data.likeCount.toLocaleString(), inline: true },
          ...(first.fields ?? []),
        ],
        author: {
          icon_url: userImage,
          name: data.userName,
          url: this.PIXIV_USER_ENDPOINT + data.userId,
        },
      },
      ...rest,
    ];

    return embeds.map((embed) => new Discord.MessageEmbed(embed));
  }
}
