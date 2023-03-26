import * as path from "path";
//
import * as cheerio from "cheerio";
import MarkdownIt from "markdown-it";

import WPPost from "../../../src/lib/WPPost";

import { Template } from "../../../src/lib/WPPost/Markdown";

const config = require("../../config.json");
const post01 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.post01);
const sample = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.sample);
const nopost01 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.nopost01);
const nopost02 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.nopost02);
const nopost03 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.nopost03);
const nopost04 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.nopost04);
const nopost05 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.nopost05);

describe("#postAsync", () => {
  test("default", async () => {
    //
    const wpost = new WPPost(post01);
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
    const wpost = new WPPost(post01);

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
  test("default", async () => {
    const wpost = new WPPost(sample);
    const results = await wpost.getLinksAsync();

    expect(results.length).toBe(3);

  });
});

describe("#getFileReferencesAsync", () => {
  test("default", async () => {
    const wpost = new WPPost(sample);
    const results = await wpost.getFileReferencesAsync();

    expect(results.length).toBe(4);

    expect(results.filter((a) => a.exists).length).toBe(2);
  });
});

describe("#renderAsync", () => {
  test("default", async () => {
    const wpost = new WPPost(sample);
    const result = await wpost.renderAsync();
    //
    expect(result).not.toBeNull();
  });
});



describe("#checkPost", () => {

  test("post01", async () => {
    //
    const wpost = new WPPost(post01);
    expect(() =>wpost.checkPost()).not.toThrow();
  });
  test("nopost01", async () => {
    //
    const wpost = new WPPost(nopost01);
    expect(() =>wpost.checkPost()).toThrow();
  });

  test("nopost02", async () => {
    //
    const wpost = new WPPost(nopost02);
    expect(() =>wpost.checkPost()).toThrow();
  });
  test("nopost03", async () => {
    //
    const wpost = new WPPost(nopost03);
    expect(() =>wpost.checkPost()).toThrow();
  });
  test("nopost04", async () => {
    //
    const wpost = new WPPost(nopost04);
    expect(() =>wpost.checkPost()).toThrow();
  });
  test("nopost05", async () => {
    //
    const wpost = new WPPost(nopost05);
    expect(() =>wpost.checkPost()).toThrow();
  });
});

