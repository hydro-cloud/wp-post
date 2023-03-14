import * as path from "path";
import * as fs from "fs";
import * as cheerio from "cheerio";

import WPPost, { REG_WWWIMG } from "../WPPost";

export interface WPCheckResult {
  path: string;
  file: string;
  exists: boolean;
}

export default class MDChecker {
  public parentDir: string;
  private content: string;

  private localFeaturedImage: string;

  constructor(public docPath: string) {
    //
    const docParsedPath = path.parse(docPath);
    //
    const wpost = new WPPost(docPath);
    //
    this.localFeaturedImage = wpost.findLocalFeaturedImage(docParsedPath);
    //
    this.content = wpost.render();
    this.parentDir = path.dirname(docPath);
  }

  public getLinks(): WPCheckResult[] {
    //
    const docParsedPath = path.parse(this.docPath);
    //
    const content: string = this.content;

    //
    const images: string[] = [];
    if (this.localFeaturedImage) images.push(this.localFeaturedImage);

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
}
