import * as path from "path";
//
import * as cheerio from "cheerio";
import MarkdownIt from "markdown-it";

import WPPost from "../../../src/lib/WPPost";

import { Template } from "../../../src/lib/WPPost/Markdown";

const config = require("../../config.json");
const docPath01 = path.join(path.resolve(__dirname, '../../..', 'tests'), config.samples.post01);
const docPath02 = path.join(path.resolve(__dirname, '../../..', 'tests'), config.samples.sample);

describe("#postAsync", () => {
  test("default", async () => {
    //
    const wpost = new WPPost(docPath01);
    //
    const apiUrl = config.apiUrl;
    const authUser = config.authUser;
    const authPassword = config.authPassword;
    //
    const postId = await wpost.postAsync(apiUrl, authUser, authPassword);

    expect(postId).not.toBeNull();
  }, 30000);


  
  test("custom render", async () => {
    //
    const wpost = new WPPost(docPath01);

    wpost.use(require("markdown-it-container"), "detail", {
      //
    });

    wpost.template.tplDetail = new Template(
      `<details ><summary>!!{{label}}!!aaa</summary>`,
      `</details>`
    );
    wpost.template.detail = (tokens: any, idx: any): string => {
      var m = tokens[idx].info.trim().match(/^detail\s+(.*)$/);

      let label = "";
      if (Array.isArray(m) && m.length >= 2)
        label = MarkdownIt().utils.escapeHtml(m[1]);

      if (tokens[idx].nesting === 1) {
        return wpost.template.tplDetail.renderStart({ label: label });
      } else {
        return wpost.template.tplDetail.renderEnd();
      }
    };

    wpost.template.code = (
      _ch: cheerio.CheerioAPI,
      _code: cheerio.Element,
      _useLineNumbers: boolean
    ): string => {
      // 
      return `<code>abcd</code>`;
    };
    //
    //
    const html = await wpost.renderAsync();

    expect(html).not.toBeNull();
  }, 30000);

  // test("error", async () => {
  //   //
  //   await expect(async():Promise<void>=>{
      
  //   const wpost = new WPPost(docPath02);
  //   //
  //   const apiUrl = config.apiUrl;
  //   const authUser = config.authUser;
  //   const authPassword = config.authPassword;
  //   //
  //     await  wpost.postAsync(apiUrl, authUser, authPassword);
  //   }).toThrow(Error);
  // }, 30000);
});

describe("#getLinksAsync", () => {
  test("default", async() => {
    const checker = new WPPost(docPath02);
    const results = await checker.getLinksAsync();

    expect(results.length).toBe(3);

  });
});

describe("#getFileReferencesAsync", () => {
  test("default", async() => {
    const checker = new WPPost(docPath02);
    const results = await checker.getFileReferencesAsync();

    expect(results.length).toBe(4);

    expect(results.filter((a) => a.exists).length).toBe(2); 
  });
});

describe("#renderAsync", () => {
  test("default", async () => {
    const checker = new WPPost(docPath02);
    const result = await checker.renderAsync();
    //
    expect(result).not.toBeNull();
  });
});
