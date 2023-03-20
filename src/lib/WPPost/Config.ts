import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import * as process from "process";

import { MarkdownOption } from ".";



export default class Config {
  
  /** */
  public apiUrl: string = "";
  /** */
  public authUser: string = "";
  /** */
  public authPassword: string = "";
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
  /** */
  public forceUploadImage: boolean = false;


  public options: MarkdownOption = {
    useLineNumbers: false,
    useLinkCard: false,
  };

  public getSavePath(): string {
    // FIXME: hardcode
    const projectDirName = ".wppost";

    let saveDir;
    if (os.platform() === "win32") {
      // for windows
      const appDataPath = process.env["APPDATA"];
      if (!appDataPath) throw new Error("can not find APPDATA.");
      saveDir = path.join(appDataPath, projectDirName);
    } else {
      // for unix.
      saveDir = path.join(os.homedir(), projectDirName);
    }

    // 
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir);
    }

    // FIXME: hardcode
    const savePath = path.join(saveDir, "config.json");
    return savePath;
  }

  private getParamName(name:string){
    // FIXME: hardcode
    return `wppost.${name}`;
  }

  public async readConfig(
    filePath: string | null = null
  ): Promise<Config> {
    try {
      //
      const saveFilePath = filePath != null ? filePath : this.getSavePath();
      //
      const data = (await fs.promises.readFile(saveFilePath)).toString("utf-8");
      if(!data)return this;
      //
      const parsed = JSON.parse(data);

      this.apiUrl = parsed[this.getParamName("apiUrl")];
      this.authUser = parsed[this.getParamName("authUser")];
      this.authPassword = parsed[this.getParamName("authPassword")];
      this.slugKeys = parsed[this.getParamName("slugKeys")];
      this.defaultFeaturedImageId = parsed[this.getParamName("defaultFeaturedImageId")];
      this.prefixFeaturedImageSlug = parsed[this.getParamName("prefixFeaturedImageSlug")];
      this.suffixFeaturedImageSlug = parsed[this.getParamName("suffixFeaturedImageSlug")];
      this.slugSepalator = parsed[this.getParamName("slugSepalator")];
      this.typeAttachedImageSlug = parsed[this.getParamName("typeAttachedImageSlug")];
      this.mediaTypes = parsed[this.getParamName("mediaTypes")];
      this.siteUrl = parsed[this.getParamName("siteUrl")];
      this.addTitleAttribute = parsed[this.getParamName("addTitleAttribute")];
      this.addSizeAttributes = parsed[this.getParamName("addSizeAttributes")];
      this.resize = parsed[this.getParamName("resize")];
      this.resizeJpegQuality = parsed[this.getParamName("resizeJpegQuality")];
      this.resizeJpegUseMozjpeg = parsed[this.getParamName("resizeJpegUseMozjpeg")];
      this.resizePngUsePalette = parsed[this.getParamName("resizePngUsePalette")];
      this.imagemaxWidth = parsed[this.getParamName("imagemaxWidth")];
      this.imagemaxHeight = parsed[this.getParamName("imagemaxHeight")];
      this.useLinkableImage = parsed[this.getParamName("useLinkableImage")];
      this.forceUploadImage = parsed[this.getParamName("forceUploadImage")];

    } catch (error) {
      console.log("Configuration is not exists.");
    }

    return this;
  }

  public async writeConfig(filePath: string | null = null) {
    try {
      let data: { [key: string]: any } = {};
      data[this.getParamName("apiUrl")] = this.apiUrl;
      data[this.getParamName("authUser")] = this.authUser;
      data[this.getParamName("authPassword")] = this.authPassword;
      data[this.getParamName("slugKeys")] = this.slugKeys;
      data[this.getParamName("defaultFeaturedImageId")] = this.defaultFeaturedImageId;
      data[this.getParamName("prefixFeaturedImageSlug")] = this.prefixFeaturedImageSlug;
      data[this.getParamName("suffixFeaturedImageSlug")] = this.suffixFeaturedImageSlug;
      data[this.getParamName("slugSepalator")] = this.slugSepalator;
      data[this.getParamName("typeAttachedImageSlug")] = this.typeAttachedImageSlug;
      data[this.getParamName("mediaTypes")] = this.mediaTypes;
      data[this.getParamName("siteUrl")] = this.siteUrl;
      data[this.getParamName("addTitleAttribute")] = this.addTitleAttribute;
      data[this.getParamName("addSizeAttributes")] = this.addSizeAttributes;
      data[this.getParamName("resize")] = this.resize;
      data[this.getParamName("resizeJpegQuality")] = this.resizeJpegQuality;
      data[this.getParamName("resizeJpegUseMozjpeg")] = this.resizeJpegUseMozjpeg;
      data[this.getParamName("resizePngUsePalette")] = this.resizePngUsePalette;
      data[this.getParamName("imagemaxWidth")] = this.imagemaxWidth;
      data[this.getParamName("imagemaxHeight")] = this.imagemaxHeight;
      data[this.getParamName("useLinkableImage")] = this.useLinkableImage;
      data[this.getParamName("forceUploadImage")] = this.forceUploadImage;

      const str = JSON.stringify(data);

      //
      const saveFilePath = filePath != null ? filePath : this.getSavePath();
      //
      await fs.promises.writeFile(saveFilePath, str);
    } catch (error) {
      console.error("Error writing configuration:", error);
    }
  }

  public async deleteConfig(filePath: string | null = null) {
    try {
      this.apiUrl = "";
      this.authUser = "";
      this.authPassword = "";

      //
      const saveFilePath = filePath != null ? filePath : this.getSavePath();
      //
      await fs.promises.writeFile(saveFilePath, "");
    } catch (error) {
      console.error("Error deleting configuration:", error);
    }
  }
}
