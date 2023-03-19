import * as path from "path";

import WPPost,{Config} from "../src/WPPost";


import {Template} from "../src/WPPost/Markdown";


const config = require("./config.json");
const docPath = path.join(__dirname, config.samples.post01);

test("Templateのテスト", async () => {

  const template = new Template();
  template.start =  `test {{test01}}{{test02}}`

  const res1 = template.renderStart({test01:"hogehoge"})
  console.log({res1})
});

test("ConfigCreatorのテスト", async () => {
  //
  const config = new Config();


  let savePath =  config.getSavePath();
  expect(savePath).not.toBeNull();

  await config.readConfig();
  //
  expect(config.apiUrl).toBe("");
  expect(config.authUser).toBe("");
  expect(config.authPassword).toBe("");

  
  config.apiUrl="a";
  config.authUser="b";
  config.authPassword="c";
  await config.writeConfig();
  
  
  await config.readConfig();
  //
  expect(config.apiUrl).toBe("a");
  expect(config.authUser).toBe("b");
  expect(config.authPassword).toBe("c");

  await config.deleteConfig();
  //
  await config.readConfig();
  //
  expect(config.apiUrl).toBe("");
  expect(config.authUser).toBe("");
  expect(config.authPassword).toBe("");

  //
}, 10000);


import * as cheerio from "cheerio";
import MarkdownIt from "markdown-it";

test("postのテスト", async () => {
  //
  const wpost = new WPPost(docPath);

  wpost.template.tplDetail= new Template(`<details ><summary>!!{{label}}!!aaa</summary>`,`</details>`);
  wpost.template.detail= (
    tokens: any, idx: any
  ) :string=>{

    var m = tokens[idx].info.trim().match(/^detail\s+(.*)$/);

    let label = "";
    if (Array.isArray(m) && m.length >= 2)
      label = MarkdownIt().utils.escapeHtml(m[1]);

    if (tokens[idx].nesting === 1) {
      return wpost.template.tplDetail.renderStart({ label: label });
    } else {
      return wpost.template.tplDetail.renderEnd();
    }

  }

  wpost.template.code =  (
    _ch: cheerio.CheerioAPI,
    _code: cheerio.Element,
    _useLineNumbers: boolean
  ): string => {
    // 関数の処理
    return `<code>abcd</code>`;
  };
  //
  const html = await wpost.renderAsync();
  expect(html).not.toBeNull();

  //
  const apiUrl = config.apiUrl;
  const authUser = config.authUser;
  const authPassword = config.authPassword;
  //
  const postId = await wpost.postAsync(apiUrl, authUser, authPassword);

  expect(postId).not.toBeNull();
}, 10000);

test("markdown: Broken links", () => {
  const checker = new WPPost(docPath);
  const results = checker.getLinks();

  expect(results.length).toBe(2 + 1); // featureimage をたす

  expect(
    results.filter((a) => a.file.includes("test01.png") && a.exists).length
  ).toBe(1);
  expect(
    results.filter((a) => a.file.includes("test00.png") && a.exists).length
  ).toBe(0);
});

test("dockument: no use", () => {
  const checker = new WPPost(docPath);
  const results = checker.getFileReferences();

  expect(results.length).toBe(4);

  expect(results.filter((a) => a.exists).length).toBe(1 + 1); // featureimageが存在しているので＋１
});


test("dockument: no use", async() => {
  const checker = new WPPost(path.join(__dirname, config.samples.post02));
  const results = await checker.renderAsync();
console.log({results})
});