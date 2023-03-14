import * as path from "path";

import MDChecker from "../src/MDChecker/index";

//
const config = require("./config.json");
const docPath = path.join(__dirname, config.samples.sample);

test("markdown: Broken links", () => {
  const checker = new MDChecker(docPath);
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
  const checker = new MDChecker(docPath);
  const results = checker.getFileReferences();

  expect(results.length).toBe(4);

  expect(results.filter((a) => a.exists).length).toBe(1 + 1); // featureimageが存在しているので＋１
});
