import * as path from "path";

import { wppost,  getLinks,  getFileReferences } from "../src";

const config = require("./config.json");

test("wppost", async () => {
  //

  const docPath = path.join(__dirname, config.samples.post01);

  const apiUrl = config.apiUrl;
  const authUser = config.authUser;
  const authPassword = config.authPassword;

  //
  const postId = await wppost(docPath, apiUrl, authUser, authPassword);
  //
  expect(postId).not.toBeNull();
}, 30000);

test("markdown中の画像のリンク切れ", () => {
  const docPath = path.join(__dirname, config.samples.sample);

  const results = getLinks(docPath);

  expect(results.length).toBe(3);
});

test("markdown中で使用されていない画像", () => {
  const docPath = path.join(__dirname, config.samples.sample);

  const results = getFileReferences(docPath);

  expect(results.length).toBe(4);
});
