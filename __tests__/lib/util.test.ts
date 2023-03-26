import { stringFormat,escapeHTML,markdownToLiner,htmlToLiner } from "../../src/lib/util";

describe("#stringFormat", () => {
  test("default", async () => {
    //
    const result = stringFormat("abc${test}efg",{test:123})
    expect(result).toBe("abc123efg")
  });
});

describe("#escapeHTML", () => {
  test("default", async () => {
    //
    const result = escapeHTML("<p>test</p>")
    expect(result).toBe("&lt;p&gt;test&lt;/p&gt;")
  });
});
describe("#markdownToLiner", () => {
  test("default", async () => {
    //
    const result = markdownToLiner("line1\r\nline2")
    console.log(result)
    expect(result).toBe("line1\\nline2")
  });
});
describe("#htmlToLiner", () => {
  test("default", async () => {
    //
    const result = htmlToLiner(`<p data="aaa">test01</p>\n<p data="bbb">test02</p>`)
    expect(result).toBe("<p data=\\\"aaa\\\">test01</p>\\n<p data=\\\"bbb\\\">test02</p>")
  });
});