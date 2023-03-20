import { Template } from "../../../src/lib/WPPost/Markdown";

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
