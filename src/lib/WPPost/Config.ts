import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import * as process from "process";


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

  /** */
  public useLineNumbers: boolean = true;   
  /** */
  public useLinkCardHtmlGenerator: boolean = false;
  /** */
  public apiPostUrl: string = "posts";
  /** */
  public apiMediaUrl: string = "media";

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

  private getParamValue(parsed:any,key:string,defaultValue:any=null):any{
    // 
    try{
      if (!(key in parsed))throw new Error(`key: [${key}] is not exists.`)
      return parsed[this.getParamName(key)]
    }catch(err:any){
      return defaultValue;
    }
  }  public async readConfig(
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

      this.apiUrl = this.getParamValue(parsed,"apiUrl",this.apiUrl);
      this.authUser = this.getParamValue(parsed,"authUser",this.authUser);
      this.authPassword = this.getParamValue(parsed,"authPassword",this.authPassword);
      this.slugKeys = this.getParamValue(parsed,"slugKeys",this.slugKeys);
      this.defaultFeaturedImageId = this.getParamValue(parsed,"defaultFeaturedImageId",this.defaultFeaturedImageId);
      this.prefixFeaturedImageSlug = this.getParamValue(parsed,"prefixFeaturedImageSlug",this.prefixFeaturedImageSlug);
      this.suffixFeaturedImageSlug = this.getParamValue(parsed,"suffixFeaturedImageSlug",this.suffixFeaturedImageSlug);
      this.slugSepalator = this.getParamValue(parsed,"slugSepalator",this.slugSepalator);
      this.typeAttachedImageSlug = this.getParamValue(parsed,"typeAttachedImageSlug",this.typeAttachedImageSlug);
      this.mediaTypes = this.getParamValue(parsed,"mediaTypes",this.mediaTypes);
      this.siteUrl = this.getParamValue(parsed,"siteUrl",this.siteUrl);
      this.addTitleAttribute = this.getParamValue(parsed,"addTitleAttribute",this.addTitleAttribute);
      this.addSizeAttributes = this.getParamValue(parsed,"addSizeAttributes",this.addSizeAttributes);
      this.resize = this.getParamValue(parsed,"resize",this.resize);
      this.resizeJpegQuality = this.getParamValue(parsed,"resizeJpegQuality",this.resizeJpegQuality);
      this.resizeJpegUseMozjpeg = this.getParamValue(parsed,"resizeJpegUseMozjpeg",this.resizeJpegUseMozjpeg);
      this.resizePngUsePalette = this.getParamValue(parsed,"resizePngUsePalette",this.resizePngUsePalette);
      this.imagemaxWidth = this.getParamValue(parsed,"imagemaxWidth",this.imagemaxWidth);
      this.imagemaxHeight = this.getParamValue(parsed,"imagemaxHeight",this.imagemaxHeight);
      this.useLinkableImage = this.getParamValue(parsed,"useLinkableImage",this.useLinkableImage);
      this.forceUploadImage = this.getParamValue(parsed,"forceUploadImage",this.forceUploadImage);
      this.useLineNumbers = this.getParamValue(parsed,"useLineNumbers",this.useLineNumbers);
      this.useLinkCardHtmlGenerator = this.getParamValue(parsed,"useLinkCardHtmlGenerator",this.useLinkCardHtmlGenerator);
      this.apiPostUrl = this.getParamValue(parsed,"apiPostUrl",this.apiPostUrl);
      this.apiMediaUrl = this.getParamValue(parsed,"apiMediaUrl",this.apiMediaUrl);

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
      data[this.getParamName("useLineNumbers")] = this.useLineNumbers;
      data[this.getParamName("useLinkCardHtmlGenerator")] = this.useLinkCardHtmlGenerator;
      data[this.getParamName("apiPostUrl")] = this.apiPostUrl;
      data[this.getParamName("apiMediaUrl")] = this.apiMediaUrl;


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
