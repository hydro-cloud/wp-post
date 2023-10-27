import * as path from "path";
import * as fs from "fs";

import axios from "axios";
import matter from "gray-matter";

import MarkdownIt from "markdown-it";
import * as cheerio from "cheerio";

import * as prettier from "prettier";

export interface CodeOption {
  useLineNumbers: boolean;
}

export interface RenderOption {
  useLineNumbers: boolean;
  useLinkCardHtmlGenerator: boolean;
}

export class Template {
  constructor(public start: string = "", public end: string = "") {}

  // alias:renderStart for single string.
  public render(param: Record<string, any> = {}) {
    return this.renderStart(param);
  }
  public renderStart(param: Record<string, any> = {}) {
    return Template.Format(this.start, param);
  }
  public renderEnd(param: Record<string, any> = {}) {
    return Template.Format(this.end, param);
  }

  public static Format(template: string, values: Record<string, any>): string {
    const keys = Object.keys(values);
    const valuesArray = Object.values(values);
    // placeholder:{{}}
    const regex = /{{([\w\d_]+)}}/g;

    // Leave unused placeholders
    // return template.replace(regex, (match, key) => {
    //   const index = keys.indexOf(key);
    //   return index !== -1 ? valuesArray[index] : match;
    // });
    // Remove unused placeholders
    return template.replace(regex, (_match, key) => {
      const index = keys.indexOf(key);
      return index !== -1 ? valuesArray[index] : "";
    });
  }
}

export class MarkdownTemplate {
  // template
  public tplDetail: Template = new Template(
    `<details ><summary>{{label}}</summary>`,
    `</details>`
  );

  public tplDetailOpen: Template = new Template(
    `<details  open="true"><summary>{{label}}</summary>`,
    `</details>`
  );

  public tplNote: Template = new Template(
    `<div class="note {{type}}"><div class="note-body">`,
    `</div></div>`
  );

  public tplSticky: Template = new Template(
    `<div class="wp-block-cocoon-blocks-sticky-box blank-box block-box sticky {{type}}">`,
    `</div>`
  );

  public tplLabel: Template = new Template(
    `<div class="wp-block-cocoon-blocks-label-box-1 label-box block-box"><div class="label-box-label block-box-label box-label"><span class="label-box-label-text block-box-label-text box-label-text">{{title}}</span></div><div class="label-box-content block-box-content box-content">`,
    `</div></div>`
  );

  public tplSpeech: Template = new Template(
    `<div class="wp-block-cocoon-blocks-balloon-ex-box-1 speech-wrap sb-id-1 sbs-stn {{position}} sbis-cb cf block-box">
        <div class="speech-person">
        <figure class="speech-icon">
        <img src="{{image}}" alt="{{name}}" class="speech-icon-image"/>
        </figure>
        <div class="speech-name">{{name}}</div>
        </div>
        <div class="speech-balloon">`,
    `</div></div>`
  );

  public linkCard: Template = new Template(
    `<a href="{{url}}" title="{{title}}" class="blogcard-wrap internal-blogcard-wrap a-wrap cf">
          <div class="blogcard internal-blogcard ib-left cf">
            <div class="blogcard-label internal-blogcard-label">
              <span class="fa"></span>
            </div>
            <figure class="blogcard-thumbnail internal-blogcard-thumbnail">
              <img src="{{image}}" alt="" class=" internal-blogcard-thumb-image" width="160" height="90" loading="lazy" decoding="async" />
            </figure>
            <div class="blogcard-content internal-blogcard-content">
              <div class="blogcard-title internal-blogcard-title">
              {{title}}
              </div>
              <div class="blogcard-snippet internal-blogcard-snippet">
              {{description}}
              </div>
            </div>
            <div class="blogcard-footer internal-blogcard-footer cf">
              <div class="blogcard-site internal-blogcard-site">
                <div class="blogcard-favicon internal-blogcard-favicon">
                  <img src="https://www.google.com/s2/favicons?domain={{url}}" alt="" class="blogcard-favicon-image internal-blogcard-favicon-image" width="16" height="16" loading="lazy" decoding="async" />
                </div>
                <div class="blogcard-domain internal-blogcard-domain">
                {{domain}}
                </div>
              </div>
            </div>
          </div>
        </a>`
  );

  public code: (
    ch: cheerio.CheerioAPI,
    code: cheerio.Element,
    useLineNumbers: boolean
  ) => string;

  public detail: (tokens: any, idx: any) => string;

  public detailOpen: (tokens: any, idx: any) => string;

  public note: (tokens: any, idx: any) => string;

  public sticky: (tokens: any, idx: any) => string;

  public label: (tokens: any, idx: any) => string;

  public speech: (tokens: any, idx: any) => string;

  constructor() {
    this.detail = (tokens: any, idx: any): string => {
      var m = tokens[idx].info.trim().match(/^detail\s+(.*)$/);

      let label = "";
      if (Array.isArray(m) && m.length >= 2)
        label = MarkdownIt().utils.escapeHtml(m[1]);

      if (tokens[idx].nesting === 1) {
        // return `<details ><summary>${label}</summary>\n`;
        return this.tplDetail.renderStart({ label: label });
      } else {
        // return "</details>\n";
        return this.tplDetail.renderEnd();
      }
    };

    this.detailOpen = (tokens: any, idx: any): string => {
      var m = tokens[idx].info.trim().match(/^detail-open\s+(.*)$/);

      //
      let label = "";
      if (Array.isArray(m) && m.length >= 2)
        label = MarkdownIt().utils.escapeHtml(m[1]);

      if (tokens[idx].nesting === 1) {
        // return `<details open="true"><summary>${label}</summary>\n`;
        return this.tplDetailOpen.renderStart({ label: label });
      } else {
        // return `</details>\n`;
        return this.tplDetailOpen.renderEnd();
      }
    };

    this.note = (tokens: any, idx: any): string => {
      var m = tokens[idx].info.trim().match(/^note\s+(.*)$/);

      if (tokens[idx].nesting === 1) {
        //
        let type = "";
        if (Array.isArray(m) && m.length >= 2)
          type = MarkdownIt().utils.escapeHtml(m[1]);

        // return `<div class="wp-block-cocoon-blocks-sticky-box blank-box block-box sticky ${type}">`;
        return this.tplNote.renderStart({ type: type });
      } else {
        // return `</div>`;
        return this.tplNote.renderEnd();
      }
    };

    this.sticky = (tokens: any, idx: any): string => {
      var m = tokens[idx].info.trim().match(/^sticky\s+(.*)$/);

      if (tokens[idx].nesting === 1) {
        //
        let type = "";
        if (Array.isArray(m) && m.length >= 2)
          type = MarkdownIt().utils.escapeHtml(m[1]);

        // return `<div class="wp-block-cocoon-blocks-sticky-box blank-box block-box sticky ${type}">`;
        return this.tplSticky.renderStart({ type: type });
      } else {
        // return `</div>`;
        return this.tplSticky.renderEnd();
      }
    };

    this.label = (tokens: any, idx: any): string => {
      var m = tokens[idx].info.trim().match(/^label\s+(.*)$/);

      if (tokens[idx].nesting === 1) {
        //
        let title = "";
        if (Array.isArray(m) && m.length >= 2)
          title = MarkdownIt().utils.escapeHtml(m[1]);
        // return `<div class="wp-block-cocoon-blocks-label-box-1 label-box block-box"><div class="label-box-label block-box-label box-label"><span class="label-box-label-text block-box-label-text box-label-text">${title}</span></div><div class="label-box-content block-box-content box-content">`;
        return this.tplLabel.renderStart({ title: title });
      } else {
        // return "</div></div>\n";
        return this.tplLabel.renderEnd();
      }
    };

    this.speech = (tokens: any, idx: any): string => {
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

        // let elm = `<div class="wp-block-cocoon-blocks-balloon-ex-box-1 speech-wrap sb-id-1 sbs-stn ${position} sbis-cb cf block-box">`;
        // elm += `<div class="speech-person">`;
        // elm += `<figure class="speech-icon">`;
        // elm += `<img src="${val.image}" alt="${val.name}" class="speech-icon-image"/>`;
        // elm += `</figure>`;
        // elm += `<div class="speech-name">${val.name}</div>`;
        // elm += `</div>`;
        // elm += `<div class="speech-balloon">`;
        // return elm;
        return this.tplSpeech.renderStart({
          position: position,
          image: val.image,
          name: val.name,
        });
      } else {
        // return "</div></div>\n";
        return this.tplLabel.renderEnd();
      }
    };
    //
    this.code = (
      ch: cheerio.CheerioAPI,
      code: cheerio.Element,
      useLineNumbers: boolean
    ): string => {
      //
      let className = ch(code).attr("class");
      let text = ch(code).text();
      let parent = ch(code).parent();
      let parent_tagName = parent.get(0)?.tagName.toLowerCase();
      //
      // if (className == null) continue;
      if (className == null) className = "";
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
        if (useLineNumbers) className += " line-numbers";
        // } else if (!!language) {
        //   className = `language-${language}`;
        //   // linenumbers
        //   if (true) className += " line-numbers";
        // }
      } else {
        className = `language-${language}`;
        // linenumbers
        if (useLineNumbers) className += " line-numbers";
      }

      //
      return `<code class="${className}">${MarkdownIt().utils.escapeHtml(
        text
      )}</code>`;
    };
  }
}

export default class Markdown {
  /** */
  protected md: MarkdownIt;

  /** */
  protected headerData: { [key: string]: any } = {};
  /** */

  protected content: string = "";

  public parentDir: string;

  // template
  public template: MarkdownTemplate = new MarkdownTemplate();

  /**
   *
   */
  constructor(public docPath: string) {
    //
    this.md = this.setup();
    //
    this.load(docPath);

    this.parentDir = path.dirname(docPath);
  }

  //
  protected load(docPath: string) {
    //
    const docParsedPath = path.parse(docPath);

    // check document file extension
    if (docParsedPath.ext !== ".md") {
      const msg = `Not a Markdown file: ${docParsedPath.base}`;
      throw new Error(msg);
    }
    //
    this.docPath = docPath;

    //
    var text = fs.readFileSync(docPath, "utf8");

    //
    const markdown = matter(text);
    //
    this.headerData = markdown.data;

    this.content = markdown.content;
    //
  }

  protected setup(): MarkdownIt {
    //
    const md = MarkdownIt({
      html: true, // 文中のコメントアウトにも必要
      linkify: false,
    })
      .use(require("markdown-it-emoji")) // emoji
      // .use(require('markdown-it-prism'))　// conflict:markdown-it-container
      // .use(require('markvis')) // error:gragh
      .use(require("markdown-it-expandable")) // +++:open , >>>:close(expand:not use.)
      .use(require("markdown-it-footnote")) //
      .use(require("markdown-it-mark")) // ==highlight==
      // :::
      .use(require("markdown-it-container"), "detail", {
        render: (tokens: any, idx: any) => this.template.detail(tokens, idx),
      })
      .use(require("markdown-it-container"), "detail-open", {
        render: (tokens: any, idx: any) =>
          this.template.detailOpen(tokens, idx),
      })
      .use(require("markdown-it-container"), "note", {
        render: (tokens: any, idx: any) => this.template.note(tokens, idx),
      })
      .use(require("markdown-it-container"), "sticky", {
        render: (tokens: any, idx: any) => this.template.sticky(tokens, idx),
      })
      .use(require("markdown-it-container"), "label", {
        render: (tokens: any, idx: any) => this.template.label(tokens, idx),
      })
      .use(require("markdown-it-container"), "speech", {
        render: (tokens: any, idx: any) => this.template.speech(tokens, idx),
      });
    // not working in WP Mermaid.
    //  .use(require('markdown-it-textual-uml'))
    //  .use(require('markdown-it-mermaid'));

    return md;
  }

  public use(plugin: MarkdownIt.PluginWithParams, ...params: any[]): Markdown {
    this.md.use(plugin, params);
    return this;
  }

  public async renderAsync(
    options: RenderOption = {
      useLineNumbers: true,
      useLinkCardHtmlGenerator: false,
    }
  ): Promise<string> {
    const content = this.md.render(this.content);

    const ch = cheerio.load(content);
    //
    this.code(ch, {
      useLineNumbers: options.useLineNumbers,
    });

    //
    if (options.useLinkCardHtmlGenerator) {
      // Keep them going despite errors.
      try {
        await this.linkCardAsync(ch);
      } catch (error: any) {
        console.error(error);
      }
    }

    return Markdown.Format(ch.html());
  }

  public async outputAsync(filePath: string): Promise<void> {
    const text = await this.renderAsync();
    await fs.promises.writeFile(filePath, text);
  }

  public code(
    ch: cheerio.CheerioAPI,
    options: CodeOption = {
      useLineNumbers: false,
    }
  ) {
    //
    const codes = ch("code");
    for (let i = 0; i < codes.length; i++) {
      //
      ch(codes[i]).replaceWith(
        //
        this.template.code(ch, codes[i], options.useLineNumbers)
      );
    }
  }

  public async linkCardAsync(ch: cheerio.CheerioAPI) {
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

      // If one of any of the items cannot be retrieved, it will not be rendered.
      if (!title || !image || !description) return;

      const template = this.template.linkCard.render({
        url: url,
        title: title,
        image: image,
        description: description,
        domain: domain,
      });

      //
      ch(as[i]).replaceWith(template);
    }
  }

  public static Format(text: string): string {
    let content = prettier.format(text, {
      parser: "html",
    });
    // body
    content = cheerio.load(content)("body").html() || "";

    return content;
  }
}
