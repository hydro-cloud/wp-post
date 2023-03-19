// ---------

import * as path from "path";
import * as fs from "fs";

import axios from "axios";
import * as cheerio from "cheerio";
import probe from "probe-image-size";

import { EventEmitter } from "events";

import  Config  from "./Config";
export {Config}


import  Markdown ,{MarkdownOption} from "./Markdown";
export {MarkdownOption}


// EventEmitterを継承したMyEmitterクラスを定義
class WPPostEvent extends EventEmitter {}


export const REG_WWWIMG = new RegExp("^(http|https):.+");


export interface WPCheckResult {
  path: string;
  file: string;
  exists: boolean;
}


/**
 * Post to wordpress from current document.
 */
export default class WPPost extends Markdown {
  /** */
  private events: WPPostEvent = new WPPostEvent();

  /** */
  private postData: { [key: string]: any } = {};

  /** */
  private config: Config = new Config();

  //
  constructor(public override docPath: string, options?: MarkdownOption) {
    //
    super(docPath, options);
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

  async postAsync(
    apiUrl: string,
    authUser: string,
    authPassword: string
  ): Promise<string> {
    //
    this.config.apiUrl = apiUrl;
    this.config.authUser = authUser;
    this.config.authPassword = authPassword;
    //
    this.events.emit("start", {});

    // postDataを解析し、slug 対象を ID にする
    for (const key in this.postData) {
      if (this.config.slugKeys.indexOf(key) > -1) {
        const slugs: string[] = this.postData[key];
        const items = await Promise.all(
          slugs.map((slug) => this.getWpItemAsync(key, { slug: slug }))
        );
        this.postData[key] = items.map((item) => item["id"]);
      }
    }
    //
    const docParsedPath = path.parse(this.docPath);
    //
    this.events.emit("parsed", this.postData);

    // mdの content 部分を markdown-it でレンダリング
    let content: string = await this.renderAsync();

    //
    this.events.emit("rendered", { content: content });

    // ノード解析
    const ch = cheerio.load(content);

    // img 処理
    await this.uploadAndSizingAsync(this.postData, ch, docParsedPath);

    // restore html
    //  content = ch.html(ch("body > *"), {
    //   decodeEntities: false,
    // });

    // 最終出力内容フォーマット
    // rootエレメントが必要なため単純にhtml()で展開(html->head,body が含まれる)
    content = WPPost.Format(ch.html());
    //
    this.postData["content"] = content;

    //
    this.events.emit("converted", { content: this.postData["content"] });

    // featured image upload
    if (!this.postData["featured_media"]) {
      await this.featuredMediaAsync(this.postData, docParsedPath);
    }
    //
    this.events.emit("configured", { postData: this.postData });

    // post
    // 対象のslugがアップロード済みか判断するためAPIにリクエスト
    const postItem = await this.getWpItemAsync(
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
  async uploadImageAsync(slug: string, imgPath: string) {
    //
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Not found local image file : ${imgPath}`);
    }
    // path
    const imgParsedPath = path.parse(imgPath);
    // load image
    const imageBin = fs.readFileSync(imgPath);

    //
    const item = await this.getWpItemAsync("media", { slug: slug }, false);

    // 存在済みか？
    if (item) {
      // 存在済みの場合削除してアップロードしなおすか？
      if (!this.config.forceUploadImage) return item;
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

  async featuredMediaAsync(
    postData: { [key: string]: any },
    docParsedPath: path.ParsedPath
  ) {
    const imgPath = this.findLocalFeaturedImage(docParsedPath);
    if (imgPath === "") {
      const defaultId = this.config.defaultFeaturedImageId;
      if (defaultId >= 0) {
        postData["featured_media"] = this.config.defaultFeaturedImageId;
      }
    } else {
      const imgSlug = this.getFeaturedImageSlug(postData["slug"]);
      const imgItem = await this.uploadImageAsync(imgSlug, imgPath);
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

  private async uploadAndSizingAsync(
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
      if (this.config.addTitleAttribute) {
        if (!ch(imgs[i]).attr("title")) {
          ch(imgs[i]).attr("title", ch(imgs[i]).attr("alt"));
        }
      }

      // Get image size information
      const [orgImgWidth, orgImgHeight] = await WPPost.GetImageSizeAsync(
        docParsedPath.dir,
        srcAttr
      );
      const [maxImgWidth, maxImgHeight] = this.getImageMaxSize();
      const [displayImgWidth, displayImgHeight] = WPPost.CalculateImageSize(
        orgImgWidth,
        orgImgHeight,
        maxImgWidth,
        maxImgHeight
      );

      // replace src attr
      if (srcAttr.match(REG_WWWIMG)) {
        // www link -> as is
        // srcAttr = srcAttr
        if (this.config.resize) {
          ch(imgs[i]).attr("width", displayImgWidth.toString());
          ch(imgs[i]).attr("height", displayImgHeight.toString());
        } else {
          if (this.config.addSizeAttributes) {
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
        if (this.config.resize) {
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
                  quality: this.config.resizeJpegQuality,
                  mozjpeg: this.config.resizeJpegUseMozjpeg,
                });
              }
              if (ext === ".png") {
                data = data.png({
                  palette: this.config.resizePngUsePalette,
                });
              }
              data.toFile(thumbnail);
            } catch (err) {
              const msg = `Can't generate thumbnail file: ${attachedImgPath}`;
              throw new Error(msg);
            }

            /* upload thumbnail to wordpress */
            const imgItem = await this.uploadImageAsync(imgSlug, thumbnail);
            //
            srcAttr = this.replaceAttachedImageUrl(imgItem["source_url"]);
            linkUri = srcAttr;

            if (this.config.addSizeAttributes) {
              ch(imgs[i]).attr("width", displayImgWidth.toString());
              ch(imgs[i]).attr("height", displayImgHeight.toString());
            }
          }
        } else {
          const imgItem = await this.uploadImageAsync(imgSlug, attachedImgPath);

          // replace src
          srcAttr = this.replaceAttachedImageUrl(imgItem["source_url"]);
          linkUri = srcAttr;

          if (this.config.addSizeAttributes) {
            ch(imgs[i]).attr("width", orgImgWidth.toString());
            ch(imgs[i]).attr("height", orgImgHeight.toString());
          }
        }
      }
      const newImgTag = ch.html(ch(imgs[i]).attr("src", srcAttr));
      if (this.config.useLinkableImage) {
        ch(imgs[i]).replaceWith(`<a href="${linkUri}">${newImgTag}</a>`);
      } else {
        ch(imgs[i]).replaceWith(`${newImgTag}`);
      }
    }
  }

  /**
   * Find item by slug from http request.
   */
  private async getWpItemAsync(
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
    if (!this.config.authUser) throw new Error("authUser is required.");
    if (!this.config.authPassword) throw new Error("authPassword is required.");
    //
    return {
      username: this.config.authUser,
      password: this.config.authPassword,
    };
  }

  /**
   * URL of REST API
   */
  private getUrl(label: string): string {
    return `${this.config.apiUrl}/${label}`;
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
    const prefix: string = this.config.prefixFeaturedImageSlug;
    const suffix: string = this.config.suffixFeaturedImageSlug;
    const sep: string = this.config.slugSepalator;
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
    const typeSlug: string = this.config.typeAttachedImageSlug;
    const sep: string = this.config.slugSepalator;
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
    return this.config.mediaTypes.map((mType) => mType.split(",")[0].trim());
  }

  /**
   * Media type
   */
  private getMediaType(extension: string): string {
    for (const mediaType of this.config.mediaTypes) {
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
    const siteUrl: string = this.config.siteUrl.replace(/\/$/, ""); // remove trailing slash if exist
    return imgSrc.replace(siteUrl, "");
  }

  private getImageMaxSize(): [number, number] {
    return [this.config.imagemaxWidth, this.config.imagemaxHeight];
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

  public getLinks(): WPCheckResult[] {
    //
    const docParsedPath = path.parse(this.docPath);
    //
    const content: string = this.content;

    const localFeaturedImage = this.findLocalFeaturedImage(docParsedPath);

    //
    const images: string[] = [];
    if (localFeaturedImage) images.push(localFeaturedImage);

    //
    const ch = cheerio.load(content);
    for (const c of ch("img")) {
      const srcAttr = ch(c).attr("src");
      if (!srcAttr) continue;
      if (srcAttr.match(REG_WWWIMG)) continue;
      //
      const attachedImgPath = path.join(docParsedPath.dir, srcAttr);
      images.push(attachedImgPath);
    }

    //
    const files: WPCheckResult[] = [];
    for (const image of images) {
      files.push({
        path: image,
        file: image.replace(`${this.parentDir}\\`, ""),
        exists: fs.existsSync(image),
      } as WPCheckResult);
    }

    return files;
  }

  public getFileReferences(
    targets: string[] = [".png", ".jpg", ".gif"]
  ): WPCheckResult[] {
    // closer的に、指定フォルダ配下にある画像情報を取得する関数定義
    const listFiles = (dir: string): string[] =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((dirent) =>
          dirent.isFile()
            ? [path.join(dir, dirent.name)]
            : listFiles(path.join(dir, dirent.name))
        );
    // markdown で使用されている img とそのファイル情報を取得
    const files1: WPCheckResult[] = this.getLinks();
    //
    const files2: WPCheckResult[] = [];
    // .md が存在するカレントディレクトリ内の画像（特定の拡張子を指定）を展開
    for (const f of listFiles(this.parentDir).filter((a) =>
      targets.includes(path.extname(a))
    )) {
      files2.push({
        path: f,
        file: f.replace(`${this.parentDir}\\`, ""),
        exists: files1.filter((a) => a.path == f).length > 0, // Markdown中で使用されているかの有無
      } as WPCheckResult);
    }

    return files2;
  }

  /* ---------- static ----------*/

  /**
   * find feature image from local path
   */
  public static async GetImageSizeAsync(base: string, src: string) {
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

  public static CalculateImageSize(
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
}
