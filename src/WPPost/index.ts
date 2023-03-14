// ---------

import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import matter from "gray-matter";
import * as cheerio from "cheerio";
import probe from "probe-image-size";

import { EventEmitter } from "events";

// EventEmitterを継承したMyEmitterクラスを定義
class WPPostEvent extends EventEmitter {}

import MarkdownIt from "markdown-it";

export const REG_WWWIMG = new RegExp("^(http|https):.+");

export interface WPPostOption {
  apiUrl: string;
}

export class Markdown {
  /** */
  private md: MarkdownIt;

  /** */
  protected headerData: { [key: string]: any } = {};
  /** */

  private content: string = "";

  /**
   *
   */
  constructor(public docPath: string) {
    //
    this.md = Markdown.Setup();
    //
    this.load(docPath);
  }

  //
  private load(docPath: string) {
    //
    const docParsedPath = path.parse(docPath);

    // check document file extension
    if (docParsedPath.ext !== ".md") {
      const msg = `Not a Markdow file: ${docParsedPath.base}`;
      throw new Error(msg);
    }
    //
    this.docPath = docPath;

    //
    var text = fs.readFileSync(docPath, "utf8");

    // ヘッダ部を解析しpostDataを構築
    const markdown = matter(text);
    //
    this.headerData = markdown.data;

    this.content = markdown.content;
    //
  }

  private static Setup(): MarkdownIt {
    //
    const md = MarkdownIt({
      html: true, // 文中のコメントアウトにも必要
      linkify: false,
    })
      .use(require("markdown-it-emoji")) // 絵文字を出す
      // .use(require('markdown-it-prism'))　// markdown-it-containerと被るので不使用
      // .use(require('markvis')) // グラフ表示 エラーになるので使わない
      .use(require("markdown-it-expandable")) // +++:open , >>>:close(これは別の意味なので使用不可)  でexpand
      .use(require("markdown-it-footnote")) // 注釈をつかう
      .use(require("markdown-it-mark")) // ==ハイライト==
      // ::: コンテナを利用した独自レイアウト
      .use(require("markdown-it-container"), "detail", {
        validate: function (params: any) {
          return params.trim().match(/^detail\s+(.*)$/);
        },

        render: function (tokens: any, idx: any) {
          var m = tokens[idx].info.trim().match(/^detail\s+(.*)$/);

          if (tokens[idx].nesting === 1) {
            // <details open> で初期がOpen
            return (
              "<details ><summary>" + md.utils.escapeHtml(m[1]) + "</summary>\n"
            );
          } else {
            return "</details>\n";
          }
        },
      })
      .use(require("markdown-it-container"), "note", {
        validate: function (params: any) {
          return params.trim().match(/^note\s+(.*)$/);
        },

        render: function (tokens: any, idx: any) {
          var m = tokens[idx].info.trim().match(/^note\s+(.*)$/);

          if (tokens[idx].nesting === 1) {
            return (
              '<div class="note ' +
              md.utils.escapeHtml(m[1]) +
              '"><div class="note-body">'
            );
          } else {
            return "</div></div>\n";
          }
        },
      })
      // cocoon: 付箋風ボックス
      .use(require("markdown-it-container"), "sticky", {
        validate: function (params: any) {
          return params.trim().match(/^sticky\s+(.*)$/);
        },

        render: function (tokens: any, idx: any) {
          var m = tokens[idx].info.trim().match(/^sticky\s+(.*)$/);

          if (tokens[idx].nesting === 1) {
            return (
              '<div class="wp-block-cocoon-blocks-sticky-box blank-box block-box sticky ' +
              md.utils.escapeHtml(m[1]) +
              '">'
            );
          } else {
            return "</div>\n";
          }
        },
      })
      // cocoon: ラベルボックス
      .use(require("markdown-it-container"), "label", {
        validate: function (params: any) {
          return params.trim().match(/^label\s+(.*)$/);
        },

        render: function (tokens: any, idx: any) {
          var m = tokens[idx].info.trim().match(/^label\s+(.*)$/);

          if (tokens[idx].nesting === 1) {
            return `<div class="wp-block-cocoon-blocks-label-box-1 label-box block-box"><div class="label-box-label block-box-label box-label"><span class="label-box-label-text block-box-label-text box-label-text">${md.utils.escapeHtml(
              m[1]
            )}</span></div><div class="label-box-content block-box-content box-content">`;
          } else {
            return "</div>\n";
          }
        },
      })

      // cocoon: speech-balloon
      .use(require("markdown-it-container"), "speech", {
        validate: function (params: any) {
          return params.trim().match(/^speech\s+(.*)$/);
        },

        render: function (tokens: any, idx: any) {
          var m = tokens[idx].info.trim().match(/^speech\s+(.*)$/);

          if (tokens[idx].nesting === 1) {
            let val = {
              name: "",
              image: "",
              opposite: false,
            };
            if (m[1]) val = JSON.parse(m[1]);
            //
            const position = val.opposite ? "sbp-r" : "sbp-l";

            let elm = `<div class="wp-block-cocoon-blocks-balloon-ex-box-1 speech-wrap sb-id-1 sbs-stn ${position} sbis-cb cf block-box">`;
            elm += `<div class="speech-person">`;
            elm += `<figure class="speech-icon">`;
            elm += `<img src="${val.image}" alt="${val.name}" class="speech-icon-image"/>`;
            elm += `</figure>`;
            elm += `<div class="speech-name">${val.name}</div>`;
            elm += `</div>`;
            elm += `<div class="speech-balloon">`;
            return elm;
          } else {
            return "</div></div>\n";
          }
        },
      });
    // WP Mermaidに対応しない
    //  .use(require('markdown-it-textual-uml'))
    //  .use(require('markdown-it-mermaid'));

    return md;
  }

  public render(): string {
    return this.md.render(this.content);
  }
}

/**
 * Post to wordpress from current document.
 */
export default class WPPost extends Markdown {
  /** */
  private events: WPPostEvent = new WPPostEvent();

  /** */
  private postData: { [key: string]: any } = {};

  // setting
  /** */
  private apiUrl: string = "";
  /** */
  private authUser: string = "";
  /** */
  private authPassword: string = "";

  /** */
  public slugKeys: string[] = ["categories", "tags"];
  /** */
  public defaultFeaturedImageId: number = -1;
  /** */
  public prefixFeaturedImageSlug: string = "";
  /** */
  public suffixFeaturedImageSlug: string = "featured-image";
  /** */
  public slugSepalator: string = "-";
  /** */
  public typeAttachedImageSlug: string = "prefix";
  /** */
  public mediaTypes: string[] = [
    ".jpg,image/jpg",
    ".jpeg,image/jpg;",
    ".png,image/png;",
    ".gif,image/gif",
  ];
  /** */
  public siteUrl: string = "https://yoursite";

  /** */
  public addTitleAttribute: boolean = false;
  /** */
  public addSizeAttributes: boolean = false;
  /** */
  public resize: boolean = false;
  /** */
  public resizeJpegQuality: number = 80;
  /** */
  public resizeJpegUseMozjpeg: boolean = true;
  /** */
  public resizePngUsePalette: boolean = true;
  /** */
  public imagemaxWidth: number = 300;
  /** */
  public imagemaxHeight: number = 300;
  /** */
  public useLinkableImage: boolean = false;

  constructor(public override docPath: string) {
    //
    super(docPath);
    //
    const docParsedPath = path.parse(docPath);
    //
    for (const key in this.headerData) {
      this.postData[key] = this.headerData[key];
    }
    // slug指定がない場合はファイル名をslugとする
    if (!this.postData["slug"]) {
      this.postData["slug"] = docParsedPath.name;
    }
  }

  async post(
    apiUrl: string,
    authUser: string,
    authPassword: string
  ): Promise<string> {
    //
    this.apiUrl = apiUrl;
    this.authUser = authUser;
    this.authPassword = authPassword;

    //
    this.events.emit("start", {});

    // postDataを解析し、llug 対象を ID にする
    for (const key in this.postData) {
      if (this.slugKeys.indexOf(key) > -1) {
        const slugs: string[] = this.postData[key];
        const items = await Promise.all(
          slugs.map((slug) => this.getWpItem(key, { slug: slug }))
        );
        this.postData[key] = items.map((item) => item["id"]);
      }
    }
    //
    const docParsedPath = path.parse(this.docPath);
    //
    this.events.emit("parsed", this.postData);

    // mdの content 部分を markdown-it でレンダリング
    const content: string = this.render();

    //
    this.events.emit("rendered", { content: content });

    // ノード解析
    const ch = cheerio.load(content);

    //
    await this.uploadAndSizing(this.postData, ch, docParsedPath);
    await WPPost.code(ch);
    await WPPost.linkCard(ch);

    // restore html
    this.postData["content"] = ch.html(ch("body > *"), {
      decodeEntities: false,
    });

    //
    this.events.emit("converted", { content: this.postData["content"] });

    // featured image upload
    if (!this.postData["featured_media"]) {
      await this.featured_media(this.postData, docParsedPath);
    }
    //
    this.events.emit("configured", { postData: this.postData });

    // post
    // 対象のslugがアップロード済みか判断するためAPIにリクエスト
    const postItem = await this.getWpItem(
      "posts",
      {
        slug: this.postData["slug"],
        status: "publish,future,draft,pending,private",
      },
      false
    );
    // 新規/上書き でURLが異なるので、取得結果からPOST先成型
    let postUrl = this.getUrl("posts");
    if (postItem) {
      postUrl = `${postUrl}/${postItem["id"]}/`;
    }
    // リクエスト
    const res = await axios({
      url: postUrl,
      method: `POST`,
      data: this.postData,
      auth: this.getAuth(),
    });

    //
    const id = res.data["id"];
    //
    this.events.emit("completed", { id: id });

    return id;
  }

  /**
   * upload image to wordpess
   */
  async uploadImage(slug: string, imgPath: string) {
    //
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Not found local image file : ${imgPath}`);
    }
    // path
    const imgParsedPath = path.parse(imgPath);
    // load image
    const imageBin = fs.readFileSync(imgPath);

    //
    const item = await this.getWpItem("media", { slug: slug }, false);

    // 存在済みか？
    if (item) {
      // 画像削除
      let postUrl = this.getUrl("media");
      postUrl = `${postUrl}/${item["id"]}?force=true`;
      await axios({
        url: postUrl,
        method: `DELETE`,
        auth: this.getAuth(),
      });
    }

    // create header
    const headers: { [name: string]: string } = {
      "Content-Type": this.getMediaType(imgParsedPath.ext),
      "Content-Disposition": `attachment; filename=${slug}${imgParsedPath.ext}`,
    };

    const res = await axios({
      url: this.getUrl("media"),
      method: `POST`,
      headers: headers,
      data: imageBin,
      auth: this.getAuth(),
    });
    return res.data;
  }

  async featured_media(
    postData: { [key: string]: any },
    docParsedPath: path.ParsedPath
  ) {
    const imgPath = this.findLocalFeaturedImage(docParsedPath);
    if (imgPath === "") {
      const defaultId = this.defaultFeaturedImageId;
      if (defaultId >= 0) {
        postData["featured_media"] = this.defaultFeaturedImageId;
      }
    } else {
      const imgSlug = this.getFeaturedImageSlug(postData["slug"]);
      const imgItem = await this.uploadImage(imgSlug, imgPath);
      postData["featured_media"] = imgItem["id"];
    }
  }

  public findLocalFeaturedImage(docParsedPath: path.ParsedPath) {
    for (const ext of this.getMediaExtensions()) {
      const imgPath = path.join(
        docParsedPath.dir,
        `${docParsedPath.name}${ext}`
      );
      if (fs.existsSync(imgPath)) {
        return imgPath;
      }
    }
    return "";
  }

  private async uploadAndSizing(
    postData: { [key: string]: any },
    ch: cheerio.CheerioAPI,
    docParsedPath: path.ParsedPath
  ) {
    const imgs = ch("img");
    for (let i = 0; i < imgs.length; i++) {
      // src attr
      let srcAttr = ch(imgs[i]).attr("src");
      if (!srcAttr) continue;

      // save src attr to use useLinkableImage
      let linkUri = srcAttr;

      // add title attribute
      if (this.addTitleAttribute) {
        if (!ch(imgs[i]).attr("title")) {
          ch(imgs[i]).attr("title", ch(imgs[i]).attr("alt"));
        }
      }

      // Get image size information
      const [orgImgWidth, orgImgHeight] = await WPPost.getImageSize(
        docParsedPath.dir,
        srcAttr
      );
      const [maxImgWidth, maxImgHeight] = this.getImageMaxSize();
      const [displayImgWidth, displayImgHeight] = WPPost.calculateImageSize(
        orgImgWidth,
        orgImgHeight,
        maxImgWidth,
        maxImgHeight
      );

      // replace src attr
      if (srcAttr.match(REG_WWWIMG)) {
        // www link -> as is
        // srcAttr = srcAttr
        if (this.resize) {
          ch(imgs[i]).attr("width", displayImgWidth.toString());
          ch(imgs[i]).attr("height", displayImgHeight.toString());
        } else {
          if (this.addSizeAttributes) {
            ch(imgs[i]).attr("width", orgImgWidth.toString());
            ch(imgs[i]).attr("height", orgImgHeight.toString());
          }
        }
      } else {
        // local(relative link) -> upload and replace src attr
        // upload
        const attachedImgPath = path.join(docParsedPath.dir, srcAttr);
        const imgSlug = this.getAttachedImageSlug(
          path.parse(attachedImgPath).name,
          postData["slug"]
        );
        /*
        const imgItem = await uploadImage(context, imgSlug, attachedImgPath);
        // replace src
        srcAttr = context.replaceAttachedImageUrl(imgItem["source_url"]);
        linkUri = srcAttr;
        */

        // generate thumbnail image if needed.
        if (this.resize) {
          if (
            orgImgWidth !== displayImgWidth ||
            orgImgHeight !== displayImgHeight
          ) {
            const size =
              displayImgWidth.toString() + "x" + displayImgHeight.toString();
            const thumbnail = path.join(
              path.parse(attachedImgPath).dir,
              path.parse(attachedImgPath).name +
                "-" +
                size +
                path.parse(attachedImgPath).ext
            );
            //
            // const thumbnailSlug = this.getAttachedImageThumbnailSlug(imgSlug, displayImgWidth, displayImgHeight);

            /* generate thumbnail */
            const sharp = require("sharp");
            try {
              let data = sharp(attachedImgPath).resize({
                width: displayImgWidth,
                height: displayImgHeight,
                fit: "fill",
              });

              // encode JPEG or PNG according to configuration
              const ext = path.parse(attachedImgPath).ext.toLowerCase();
              if (ext === ".jpg" || ext === ".jpeg") {
                data = data.jpeg({
                  quality: this.resizeJpegQuality,
                  mozjpeg: this.resizeJpegUseMozjpeg,
                });
              }
              if (ext === ".png") {
                data = data.png({
                  palette: this.resizePngUsePalette,
                });
              }
              data.toFile(thumbnail);
            } catch (err) {
              const msg = `Can't generate thumbnail file: ${attachedImgPath}`;
              throw new Error(msg);
            }

            /* upload thumbnail to wordpress */
            const imgItem = await this.uploadImage(imgSlug, thumbnail);
            //
            srcAttr = this.replaceAttachedImageUrl(imgItem["source_url"]);
            linkUri = srcAttr;

            if (this.addSizeAttributes) {
              ch(imgs[i]).attr("width", displayImgWidth.toString());
              ch(imgs[i]).attr("height", displayImgHeight.toString());
            }
          }
        } else {
          const imgItem = await this.uploadImage(imgSlug, attachedImgPath);

          // replace src
          srcAttr = this.replaceAttachedImageUrl(imgItem["source_url"]);
          linkUri = srcAttr;

          if (this.addSizeAttributes) {
            ch(imgs[i]).attr("width", orgImgWidth.toString());
            ch(imgs[i]).attr("height", orgImgHeight.toString());
          }
        }
      }
      const newImgTag = ch.html(ch(imgs[i]).attr("src", srcAttr));
      if (this.useLinkableImage) {
        ch(imgs[i]).replaceWith(`<a href="${linkUri}">${newImgTag}</a>`);
      } else {
        ch(imgs[i]).replaceWith(`${newImgTag}`);
      }
    }
  }

  /**
   * Find item by slug from http request.
   */
  private async getWpItem(
    label: string,
    params: { [key: string]: string },
    isThrow = true
  ) {
    const res = await axios({
      url: this.getUrl(label),
      method: `GET`,
      params: params,
      auth: this.getAuth(),
    });
    if (res.data.length === 1) {
      return res.data[0];
    } else {
      if (isThrow) {
        throw new Error(
          `${label}=${params["slug"]} is not found or duplicated.`
        );
      } else {
        return null;
      }
    }
  }

  /**
   * Auth of REST API
   */
  private getAuth(): any {
    //
    if (!this.authUser) throw new Error("authUser is required.");
    if (!this.authPassword) throw new Error("authPassword is required.");
    //
    return {
      username: this.authUser,
      password: this.authPassword,
    };
  }

  /**
   * URL of REST API
   */
  private getUrl(label: string): string {
    return `${this.apiUrl}/${label}`;
  }

  /**
   * Keys of Slug to ID
   */
  /*
  private getSlugKeys(): string[] {
    return this.slugKeys.map((key) => key.trim());
  }
  */

  /**
   * Slug of featured image
   */
  private getFeaturedImageSlug(documentSlug: string): string {
    const prefix: string = this.prefixFeaturedImageSlug;
    const suffix: string = this.suffixFeaturedImageSlug;
    const sep: string = this.slugSepalator;
    let result = documentSlug;
    if (prefix.trim() !== "") {
      result = prefix + sep + result;
    }
    if (suffix.trim() !== "") {
      result = result + sep + suffix;
    }
    return result;
  }

  /**
   * Slug of attached image
   */
  private getAttachedImageSlug(
    originalSlug: string,
    documentSlug: string
  ): string {
    const typeSlug: string = this.typeAttachedImageSlug;
    const sep: string = this.slugSepalator;
    if (typeSlug === "prefix") {
      return documentSlug + sep + originalSlug;
    } else if (typeSlug === "suffix") {
      return originalSlug + sep + documentSlug;
    } else {
      return originalSlug;
    }
  }

  /**
   * Media extensions
   */
  private getMediaExtensions(): string[] {
    return this.mediaTypes.map((mType) => mType.split(",")[0].trim());
  }

  /**
   * Media type
   */
  private getMediaType(extension: string): string {
    for (const mediaType of this.mediaTypes) {
      const kv = mediaType.split(",");
      if (kv[0].trim() === extension) {
        return kv[1].trim();
      }
    }
    throw new Error(`Not support media type : ${extension}`);
  }

  /**
   * Create relative Url
   */
  private replaceAttachedImageUrl(imgSrc: string): string {
    const siteUrl: string = this.siteUrl;
    return imgSrc.replace(siteUrl, "");
  }

  private getImageMaxSize(): [number, number] {
    return [this.imagemaxWidth, this.imagemaxHeight];
  }

  /*
  private getAttachedImageThumbnailSlug(
    imageSlug: string,
    width: number,
    height: number
  ): string {
    const sep: string = this.slugSepalator;
    const size: string = width.toString() + "x" + height.toString();
    return imageSlug + sep + size;
  }
  */

  /* ---------- static ----------*/

  /**
   * find feature image from local path
   */
  public static async getImageSize(base: string, src: string) {
    if (src.match(REG_WWWIMG)) {
      const result = await probe(src);
      return [result.width, result.height];
    }

    //
    const filePath = path.join(base, src);

    // 存在チェック
    if (!fs.existsSync(filePath))
      throw new Error(`file is not founded. ${filePath}`);

    const data = fs.readFileSync(filePath);
    const result = probe.sync(data);
    //
    if (result == null) throw new Error(`prove error.`);

    return [result.width, result.height];
  }

  public static calculateImageSize(
    imgWidth: number,
    imgHeight: number,
    maxWidth: number,
    maxHeight: number
  ): [number, number] {
    if (imgWidth <= maxWidth || maxWidth === 0) {
      if (imgHeight <= maxHeight || maxHeight === 0) {
        return [imgWidth, imgHeight];
      } else {
        return [Math.trunc((imgWidth * maxHeight) / imgHeight), maxHeight];
      }
    }

    //
    if (imgHeight <= maxHeight || maxHeight === 0) {
      return [maxWidth, Math.trunc((imgHeight * maxWidth) / imgWidth)];
    }

    //
    const widthRatio = imgWidth / maxWidth;
    const heightRatio = imgHeight / maxHeight;
    if (widthRatio > heightRatio) {
      return [maxWidth, Math.trunc((imgHeight * maxWidth) / imgWidth)];
    } else {
      return [Math.trunc((imgWidth * maxHeight) / imgHeight), maxHeight];
    }
  }

  public static code(ch: cheerio.CheerioAPI) {
    //
    const codes = ch("code");
    for (let i = 0; i < codes.length; i++) {
      //
      let className = ch(codes[i]).attr("class");
      let text = ch(codes[i]).text();
      let parent = ch(codes[i]).parent();
      let parent_tagName = parent.get(0)?.tagName.toLowerCase();
      //
      if (className == null) continue;
      //
      let languages = className
        .replace("language-", "")
        .replace("diff-", "")
        .replace("diff_", "")
        .trim()
        .split(":");
      //
      let language = languages.length >= 1 ? languages[0] : null;
      let filePath = languages.length >= 2 ? languages[1] : null;

      if (parent_tagName === "pre") {
        // prism
        if (!!language) ch(parent).attr("data-label", filePath);
        //
        if (!!language) ch(parent).attr("data-lang", language);
        if (!!filePath) ch(parent).attr("data-file", filePath);
      }

      if (className.startsWith("language-mermaid")) {
        // WP mermaid
        className = "mermaid";
      } else if (className.startsWith("language-diff")) {
        // diff
        className = "language-diff";
        className += " diff-highlight";
        // linenumbers
        if (true) className += " line-numbers";
      } else if (!!language) {
        className = `language-${language}`;
        // linenumbers
        if (true) className += " line-numbers";
      }

      //
      ch(codes[i]).replaceWith(
        `<code class="${className}">${MarkdownIt().utils.escapeHtml(
          text
        )}</code>`
      );
    }
  }

  public static async linkCard(ch: cheerio.CheerioAPI) {
    //
    const as = ch("a");
    for (let i = 0; i < as.length; i++) {
      //
      let url = ch(as[i]).attr("href");
      if (url == null) continue;

      let element = ch(as[i]).get(0);
      let parentNode = ch(as[i]).parent().get(0);

      //
      if (!element) continue;
      if (!parentNode) continue;

      if (parentNode.tagName.toLowerCase() != "p") continue;
      if (parentNode.childNodes.length != 1) continue;
      if (element.nextSibling != null) continue;
      if (element.previousSibling != null) continue;

      const res = await axios({
        url: url,
        method: `GET`,
      });

      const ch2 = cheerio.load(res.data);
      const image = ch2("meta[property='og:image']").attr("content");
      const description = ch2("meta[property='og:description']").attr(
        "content"
      );
      const title = ch2("meta[property='og:title']").attr("content");

      const domain = new URL(url).origin;

      let template = `<a href="${url}" title="${title}" class="blogcard-wrap internal-blogcard-wrap a-wrap cf">
         <div class="blogcard internal-blogcard ib-left cf">
           <div class="blogcard-label internal-blogcard-label">
             <span class="fa"></span>
           </div>
           <figure class="blogcard-thumbnail internal-blogcard-thumbnail">
             <img src="${image}" alt="" class=" internal-blogcard-thumb-image" width="160" height="90" loading="lazy" decoding="async" />
           </figure>
           <div class="blogcard-content internal-blogcard-content">
             <div class="blogcard-title internal-blogcard-title">
             ${title}
             </div>
             <div class="blogcard-snippet internal-blogcard-snippet">
             ${description}
             </div>
           </div>
           <div class="blogcard-footer internal-blogcard-footer cf">
             <div class="blogcard-site internal-blogcard-site">
               <div class="blogcard-favicon internal-blogcard-favicon">
                 <img src="https://www.google.com/s2/favicons?domain=${url}" alt="" class="blogcard-favicon-image internal-blogcard-favicon-image" width="16" height="16" loading="lazy" decoding="async" />
               </div>
               <div class="blogcard-domain internal-blogcard-domain">
               ${domain}
               </div>
             </div>
           </div>
         </div>
       </a>`;
      //
      ch(as[i]).replaceWith(template);
    }
  }
}
