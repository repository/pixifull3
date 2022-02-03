export namespace PixivIllust {
  export interface Response {
    error: boolean;
    message: string;
    body: Body;
  }

  export interface Body {
    illustId: string;
    illustTitle: string;
    illustComment: string;
    id: string;
    title: string;
    description: string;
    illustType: number;
    createDate: Date;
    uploadDate: Date;
    restrict: number;
    xRestrict: number;
    sl: number;
    urls: Urls;
    tags: Tags;
    alt: string;
    storableTags: string[];
    userId: string;
    userName: string;
    userAccount: string;
    userIllusts: { [key: string]: ZengoIDWork | null };
    likeData: boolean;
    width: number;
    height: number;
    pageCount: number;
    bookmarkCount: number;
    likeCount: number;
    commentCount: number;
    responseCount: number;
    viewCount: number;
    bookStyle: string;
    isHowto: boolean;
    isOriginal: boolean;
    imageResponseOutData: any[];
    imageResponseData: any[];
    imageResponseCount: number;
    pollData: null;
    seriesNavData: null;
    descriptionBoothId: null;
    descriptionYoutubeId: null;
    comicPromotion: null;
    fanboxPromotion: FanboxPromotion;
    contestBanners: any[];
    isBookmarkable: boolean;
    bookmarkData: null;
    contestData: null;
    zoneConfig: ZoneConfig;
    extraData: ExtraData;
    titleCaptionTranslation: TitleCaptionTranslation;
    isUnlisted: boolean;
    request: null;
    commentOff: number;
    noLoginData: NoLoginData;
  }

  export interface ExtraData {
    meta: Meta;
  }

  export interface Meta {
    title: string;
    description: string;
    canonical: string;
    alternateLanguages: AlternateLanguages;
    descriptionHeader: string;
    ogp: Ogp;
    twitter: Ogp;
  }

  export interface AlternateLanguages {
    ja: string;
    en: string;
  }

  export interface Ogp {
    description: string;
    image: string;
    title: string;
    type?: string;
    card?: string;
  }

  export interface FanboxPromotion {
    userName: string;
    userImageUrl: string;
    contentUrl: string;
    description: string;
    imageUrl: string;
    imageUrlMobile: string;
    hasAdultContent: boolean;
  }

  export interface NoLoginData {
    breadcrumbs: Breadcrumbs;
    zengoIdWorks: ZengoIDWork[];
    zengoWorkData: ZengoWorkData;
  }

  export interface Breadcrumbs {
    successor: Successor[];
    current: Current;
  }

  export interface Current {
    ja: string;
  }

  export interface Successor {
    tag: string;
    translation: Current;
  }

  export interface ZengoIDWork {
    id: string;
    title: string;
    illustType: number;
    xRestrict: number;
    restrict: number;
    sl: number;
    url: string;
    description: string;
    tags: string[];
    userId: string;
    userName: string;
    width: number;
    height: number;
    pageCount: number;
    isBookmarkable: boolean;
    bookmarkData: null;
    alt: string;
    titleCaptionTranslation: TitleCaptionTranslation;
    createDate: Date;
    updateDate: Date;
    isUnlisted: boolean;
    isMasked: boolean;
    profileImageUrl?: string;
  }

  export interface TitleCaptionTranslation {
    workTitle: null;
    workCaption: null;
  }

  export interface ZengoWorkData {
    nextWork: Work;
    prevWork: Work;
  }

  export interface Work {
    id: string;
    title: string;
  }

  export interface Tags {
    authorId: string;
    isLocked: boolean;
    tags: Tag[];
    writable: boolean;
  }

  export interface Tag {
    tag: string;
    locked: boolean;
    deletable: boolean;
    userId?: string;
    userName?: string;
  }

  export interface Urls {
    mini: string;
    thumb: string;
    small: string;
    regular: string;
    original: string;
  }

  export interface ZoneConfig {
    responsive: The500_X500;
    rectangle: The500_X500;
    "500x500": The500_X500;
    header: The500_X500;
    footer: The500_X500;
    expandedFooter: The500_X500;
    logo: The500_X500;
    relatedworks: The500_X500;
  }

  export interface The500_X500 {
    url: string;
  }
}

export namespace PixivIllustPages {
  export interface Response {
    error: boolean;
    message: string;
    body: Page[];
  }

  export interface Page {
    urls: Urls;
    width: number;
    height: number;
  }

  export interface Urls {
    thumb_mini: string;
    small: string;
    regular: string;
    original: string;
  }
}
