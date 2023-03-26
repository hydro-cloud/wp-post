import Markdown, { Template } from "../../../src/lib/WPPost/Markdown";

import * as path from "path";
import * as fs from "fs";

const config = require("../../config.json");
const post01 = path.join(path.resolve(__dirname, '../../..', '__tests__'), config.samples.post01);

const output = path.join(path.resolve(__dirname, '../../..', '__tests__'), "hogehoge.txt");

describe("#Template", () => {
  test("default", async () => {
    const template = new Template();
    template.start = `test1 {{test01}}{{test02}}`;
    template.end = `test2 {{test01}}{{test02}}`;

    //
    {
      const res = template.renderStart({ test01: "hogehoge" });
      expect(res).toBe("test1 hogehoge");
    }

    //
    {
      const res = template.renderEnd({ test02: "foo" });
      expect(res).toBe("test2 foo");
    }
  });
});


describe("#Output Markdown", () => {

  test("default", async () => {
    //
    const markdown = new Markdown(post01);
    await markdown.outputAsync(output);

    const result = await fs.promises.readFile(output, 'utf8');

    expect(result).not.toBeNull();

    await fs.promises.unlink(output)
  });
});
